import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import {
    BorderRadius,
    BrandColors,
    Colors,
    Shadows,
    Spacing,
    Typography,
} from '@/constants/design-system';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { UserRole } from '@/types';

interface CreateUserFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

interface Location {
    id: string;
    name: string;
    code: string | null;
}

interface DropdownOption {
    label: string;
    value: string;
}

const MAIN_BRANCH_ID = '00a7b14c-a0ec-4b7c-b0da-3fde5a5753c1'; // Main Branch ID from your database

// Custom Dropdown Component
const CustomDropdown: React.FC<{
    label: string;
    value: string;
    options: DropdownOption[];
    onSelect: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    error?: boolean;
}> = ({ label, value, options, onSelect, placeholder, disabled, error }) => {
    const [modalVisible, setModalVisible] = useState(false);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <>
            <TouchableOpacity
                style={[
                    styles.dropdownButton,
                    error && styles.inputError,
                    disabled && styles.dropdownDisabled,
                ]}
                onPress={() => !disabled && setModalVisible(true)}
                disabled={disabled}
            >
                <Text style={[
                    styles.dropdownButtonText,
                    !selectedOption && styles.dropdownPlaceholder
                ]}>
                    {selectedOption ? selectedOption.label : (placeholder || 'Select...')}
                </Text>
                <IconSymbol
                    name="chevron.down"
                    size={20}
                    color={disabled ? Colors.neutral[400] : Colors.neutral[600]}
                />
            </TouchableOpacity>

            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setModalVisible(false)}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{label}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <IconSymbol name="xmark" size={24} color={Colors.neutral[600]} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={options}
                            keyExtractor={(item) => item.value}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.modalOption,
                                        item.value === value && styles.modalOptionSelected
                                    ]}
                                    onPress={() => {
                                        onSelect(item.value);
                                        setModalVisible(false);
                                    }}
                                >
                                    <Text style={[
                                        styles.modalOptionText,
                                        item.value === value && styles.modalOptionTextSelected
                                    ]}>
                                        {item.label}
                                    </Text>
                                    {item.value === value && (
                                        <IconSymbol name="checkmark" size={20} color={BrandColors.primary} />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
};

export const CreateUserForm: React.FC<CreateUserFormProps> = ({
    onSuccess,
    onCancel,
}) => {
    const insets = useSafeAreaInsets();
    const { user } = useAuthStore();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        username: '',
        firstName: '',
        lastName: '',
        phone: '',
        role: 'technician' as UserRole,
        locationId: '',
    });

    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingLocations, setLoadingLocations] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [focusedField, setFocusedField] = useState<string | null>(null);

    // Fetch locations on mount
    useEffect(() => {
        fetchLocations();
    }, []);

    const fetchLocations = async () => {
        try {
            setLoadingLocations(true);
            const { data, error } = await supabase
                .from('locations')
                .select('id, name, code')
                .eq('is_active', true)
                .order('name');

            if (error) throw error;

            setLocations(data || []);

            // Set default location based on user role
            if (data && data.length > 0) {
                // Default to Main Branch for admins, or first location for others
                const defaultLocation = data.find(loc => loc.id === MAIN_BRANCH_ID) || data[0];
                setFormData(prev => ({ ...prev, locationId: defaultLocation.id }));
            }
        } catch (error: any) {
            console.error('Error fetching locations:', error);
            Alert.alert('Error', 'Failed to load branches. Please try again.');
        } finally {
            setLoadingLocations(false);
        }
    };

    const createUserDirectly = async () => {
        const { user: currentUser } = useAuthStore.getState();

        console.log('Creating user with Supabase...');

        try {
            // Step 1: Create auth user using signup
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email.trim(),
                password: formData.password,
                options: {
                    data: {
                        username: formData.username.trim(),
                        role: formData.role,
                    },
                    emailRedirectTo: undefined,
                }
            });

            if (authError) {
                console.error('Auth creation error:', authError);
                throw new Error(`Failed to create user account: ${authError.message}`);
            }

            if (!authData.user?.id) {
                throw new Error('User creation succeeded but no user ID returned');
            }

            const newUserId = authData.user.id;
            console.log('Created auth user with ID:', newUserId);

            // Step 2: Check if profile already exists (might be created by trigger)
            const { data: existingProfile, error: checkError } = await supabase
                .from('profiles')
                .select('user_id')
                .eq('user_id', newUserId)
                .single();

            if (checkError && checkError.code !== 'PGRST116') {
                console.error('Error checking existing profile:', checkError);
                throw new Error('Failed to check existing profile');
            }

            // Determine location ID - admins always get Main Branch
            const assignedLocationId = formData.role === 'admin'
                ? MAIN_BRANCH_ID
                : formData.locationId;

            if (existingProfile) {
                console.log('Profile already exists (created by trigger), updating it...');
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({
                        username: formData.username.trim(),
                        first_name: formData.firstName.trim() || formData.username.trim(),
                        last_name: formData.lastName.trim() || null,
                        phone: formData.phone.trim() || null,
                        location_id: assignedLocationId,
                        is_active: true,
                        updated_at: new Date().toISOString()
                    })
                    .eq('user_id', newUserId);

                if (updateError) {
                    console.error('Profile update error:', updateError);
                    console.warn('Profile update failed, continuing with existing profile');
                } else {
                    console.log('Updated existing profile successfully');
                }
            } else {
                console.log('Profile does not exist, creating new one...');
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert({
                        user_id: newUserId,
                        username: formData.username.trim(),
                        email: formData.email.trim(),
                        first_name: formData.firstName.trim() || formData.username.trim(),
                        last_name: formData.lastName.trim() || null,
                        phone: formData.phone.trim() || null,
                        location_id: assignedLocationId,
                        is_active: true,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    });

                if (profileError) {
                    console.error('Profile creation error:', profileError);
                    throw new Error(`Failed to create profile: ${profileError.message}`);
                } else {
                    console.log('Created new profile successfully');
                }
            }

            // Step 3: Assign role
            const { error: roleError } = await supabase
                .from('app_roles')
                .insert({
                    user_id: newUserId,
                    role: formData.role,
                    location_id: assignedLocationId,
                    created_by: currentUser?.id || null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });

            if (roleError) {
                console.error('Role assignment error:', roleError);
                throw new Error(`Failed to assign role: ${roleError.message}`);
            }

            console.log('Successfully assigned role');

            // Step 4: Assign to branch in user_locations table
            const { error: locationError } = await supabase
                .from('user_locations')
                .insert({
                    user_id: newUserId,
                    location_id: assignedLocationId,
                    is_primary: true,
                    created_at: new Date().toISOString()
                });

            if (locationError) {
                console.error('Location assignment error:', locationError);
                // Don't throw here - location assignment is not critical
                console.warn('Failed to assign location, but user was created successfully');
            } else {
                console.log('Successfully assigned to branch');
            }

            // Success!
            const roleDisplayNames = {
                admin: 'Admin',
                front_desk_manager: 'Front Desk Manager',
                floor_manager: 'Floor Manager',
                technician: 'Technician',
                manager: 'Manager',
            };

            const locationName = locations.find(loc => loc.id === assignedLocationId)?.name || 'branch';

            Alert.alert(
                'Success',
                `${roleDisplayNames[formData.role]} "${formData.username}" has been created successfully and assigned to ${locationName}!`,
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            // Reset form
                            setFormData({
                                email: '',
                                password: '',
                                username: '',
                                firstName: '',
                                lastName: '',
                                phone: '',
                                role: 'technician',
                                locationId: locations[0]?.id || '',
                            });
                            setErrors({});
                            onSuccess?.();
                        },
                    },
                ]
            );

        } catch (error: any) {
            console.error('Direct user creation error:', error);
            throw error;
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!formData.username.trim()) {
            newErrors.username = 'Username is required';
        } else if (formData.username.length < 3) {
            newErrors.username = 'Username must be at least 3 characters';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }

        if (!formData.role) {
            newErrors.role = 'Role is required';
        }

        if (!formData.locationId && formData.role !== 'admin') {
            newErrors.locationId = 'Branch assignment is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (!session?.user) {
                Alert.alert('Error', 'Please log in to continue');
                return;
            }

            await createUserDirectly();
        } catch (error: any) {
            console.error('Error creating user:', error);

            const errorMessage = error.message || 'Failed to create user';

            if (errorMessage.includes('Failed to assign role')) {
                Alert.alert(
                    'Role Assignment Error',
                    `Cannot assign role to the new user.\n\nThis indicates a backend database configuration issue. The server cannot insert the role into the app_roles table.\n\nPlease contact your system administrator to:\n• Check database permissions\n• Verify app_roles table structure\n• Review backend role assignment logic`,
                    [{ text: 'OK', style: 'default' }]
                );
            } else if (errorMessage.includes('User already exists') || errorMessage.includes('email')) {
                Alert.alert(
                    'User Already Exists',
                    'A user with this email address already exists. Please use a different email address.',
                    [{ text: 'OK', style: 'default' }]
                );
            } else {
                Alert.alert(
                    'Error Creating User',
                    errorMessage,
                    [{ text: 'OK', style: 'default' }]
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            email: '',
            password: '',
            username: '',
            firstName: '',
            lastName: '',
            phone: '',
            role: 'technician',
            locationId: locations[0]?.id || '',
        });
        setErrors({});
        onCancel?.();
    };

    const roleOptions: DropdownOption[] = [
        { value: 'technician', label: 'Technician' },
        { value: 'floor_manager', label: 'Floor Manager' },
        { value: 'front_desk_manager', label: 'Front Desk Manager' },
        { value: 'admin', label: 'Administrator' },
    ];

    const locationOptions: DropdownOption[] = locations.map(loc => ({
        value: loc.id,
        label: `${loc.name}${loc.code ? ` (${loc.code})` : ''}`,
    }));

    return (
        <ThemedView style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
            >
                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ paddingBottom: Spacing.xl }}
                >
                    {/* Custom Header with Back Button */}
                    <View style={[styles.customHeader, { paddingTop: insets.top + Spacing.md }]}>
                        <TouchableOpacity onPress={onCancel} style={styles.backButton}>
                            <IconSymbol name="chevron.left" size={24} color={BrandColors.primary} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Create New User</Text>
                    </View>

                    <View style={styles.content}>
                        {/* Role Selection Card */}
                        <View style={[styles.actionCard, styles.primaryActionCard]}>
                            <View style={[styles.iconContainer, styles.primaryIconContainer]}>
                                <IconSymbol name="person.badge.plus" size={28} color={BrandColors.primary} />
                            </View>
                            <Text style={styles.actionTitle}>User Role</Text>
                            <Text style={styles.actionSubtitle}>
                                Select the role for this user
                            </Text>
                        </View>

                        {/* Form Card */}
                        <View style={styles.formCard}>
                            {/* Role Selection */}
                            <View style={styles.formSection}>
                                <Text style={styles.sectionTitle}>Role & Access</Text>

                                <View style={styles.fieldContainer}>
                                    <Text style={styles.label}>
                                        Role <Text style={styles.required}>*</Text>
                                    </Text>
                                    <CustomDropdown
                                        label="Select Role"
                                        value={formData.role}
                                        options={roleOptions}
                                        onSelect={(value) => {
                                            setFormData({ ...formData, role: value as UserRole });
                                            if (errors.role) {
                                                setErrors({ ...errors, role: '' });
                                            }
                                            // Auto-assign Main Branch for admins
                                            if (value === 'admin') {
                                                setFormData(prev => ({ ...prev, role: value as UserRole, locationId: MAIN_BRANCH_ID }));
                                            }
                                        }}
                                        disabled={loading}
                                        error={!!errors.role}
                                    />
                                    {errors.role && <Text style={styles.errorText}>{errors.role}</Text>}
                                </View>

                                {/* Branch Assignment */}
                                <View style={styles.fieldContainer}>
                                    <Text style={styles.label}>
                                        Branch Assignment <Text style={styles.required}>*</Text>
                                    </Text>
                                    {loadingLocations ? (
                                        <ActivityIndicator size="small" color={BrandColors.primary} />
                                    ) : (
                                        <>
                                            <CustomDropdown
                                                label="Select Branch"
                                                value={formData.locationId}
                                                options={locationOptions}
                                                onSelect={(value) => {
                                                    setFormData({ ...formData, locationId: value });
                                                    if (errors.locationId) {
                                                        setErrors({ ...errors, locationId: '' });
                                                    }
                                                }}
                                                disabled={loading || formData.role === 'admin'}
                                                error={!!errors.locationId}
                                            />
                                            {formData.role === 'admin' && (
                                                <Text style={styles.helperText}>
                                                    Admins are automatically assigned to Main Branch and can view all branches
                                                </Text>
                                            )}
                                            {errors.locationId && <Text style={styles.errorText}>{errors.locationId}</Text>}
                                        </>
                                    )}
                                </View>
                            </View>

                            {/* Personal Details */}
                            <View style={styles.formSection}>
                                <Text style={styles.sectionTitle}>Personal Details</Text>

                                {/* Username Field */}
                                <View style={styles.fieldContainer}>
                                    <Text style={styles.label}>
                                        Username <Text style={styles.required}>*</Text>
                                    </Text>
                                    <View style={styles.inputContainer}>
                                        <TextInput
                                            style={[
                                                styles.input,
                                                errors.username ? styles.inputError : null,
                                                focusedField === 'username' ? styles.inputFocused : null,
                                            ]}
                                            value={formData.username}
                                            onChangeText={(text) => {
                                                setFormData({ ...formData, username: text });
                                                if (errors.username) {
                                                    setErrors({ ...errors, username: '' });
                                                }
                                            }}
                                            onFocus={() => setFocusedField('username')}
                                            onBlur={() => setFocusedField(null)}
                                            placeholder="e.g. john_doe"
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                            editable={!loading}
                                            placeholderTextColor={Colors.neutral[400]}
                                        />
                                    </View>
                                    {errors.username && (
                                        <Text style={styles.errorText}>{errors.username}</Text>
                                    )}
                                </View>

                                {/* First Name Field */}
                                <View style={styles.fieldContainer}>
                                    <Text style={styles.label}>First Name</Text>
                                    <View style={styles.inputContainer}>
                                        <TextInput
                                            style={[
                                                styles.input,
                                                focusedField === 'firstName' ? styles.inputFocused : null,
                                            ]}
                                            value={formData.firstName}
                                            onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                                            onFocus={() => setFocusedField('firstName')}
                                            onBlur={() => setFocusedField(null)}
                                            placeholder="John"
                                            autoCapitalize="words"
                                            editable={!loading}
                                            placeholderTextColor={Colors.neutral[400]}
                                        />
                                    </View>
                                </View>

                                {/* Last Name Field */}
                                <View style={styles.fieldContainer}>
                                    <Text style={styles.label}>Last Name</Text>
                                    <View style={styles.inputContainer}>
                                        <TextInput
                                            style={[
                                                styles.input,
                                                focusedField === 'lastName' ? styles.inputFocused : null,
                                            ]}
                                            value={formData.lastName}
                                            onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                                            onFocus={() => setFocusedField('lastName')}
                                            onBlur={() => setFocusedField(null)}
                                            placeholder="Doe"
                                            autoCapitalize="words"
                                            editable={!loading}
                                            placeholderTextColor={Colors.neutral[400]}
                                        />
                                    </View>
                                </View>

                                {/* Phone Field */}
                                <View style={styles.fieldContainer}>
                                    <Text style={styles.label}>Phone Number</Text>
                                    <View style={styles.inputContainer}>
                                        <TextInput
                                            style={[
                                                styles.input,
                                                focusedField === 'phone' ? styles.inputFocused : null,
                                            ]}
                                            value={formData.phone}
                                            onChangeText={(text) => setFormData({ ...formData, phone: text })}
                                            onFocus={() => setFocusedField('phone')}
                                            onBlur={() => setFocusedField(null)}
                                            placeholder="+91 9876543210"
                                            keyboardType="phone-pad"
                                            editable={!loading}
                                            placeholderTextColor={Colors.neutral[400]}
                                        />
                                    </View>
                                </View>
                            </View>

                            {/* Account Credentials */}
                            <View style={styles.formSection}>
                                <Text style={styles.sectionTitle}>Account Credentials</Text>

                                {/* Email Field */}
                                <View style={styles.fieldContainer}>
                                    <Text style={styles.label}>
                                        Email Address <Text style={styles.required}>*</Text>
                                    </Text>
                                    <View style={styles.inputContainer}>
                                        <TextInput
                                            style={[
                                                styles.input,
                                                errors.email ? styles.inputError : null,
                                                focusedField === 'email' ? styles.inputFocused : null,
                                            ]}
                                            value={formData.email}
                                            onChangeText={(text) => {
                                                setFormData({ ...formData, email: text });
                                                if (errors.email) {
                                                    setErrors({ ...errors, email: '' });
                                                }
                                            }}
                                            onFocus={() => setFocusedField('email')}
                                            onBlur={() => setFocusedField(null)}
                                            placeholder="user@example.com"
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                            editable={!loading}
                                            placeholderTextColor={Colors.neutral[400]}
                                        />
                                    </View>
                                    {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                                </View>

                                {/* Password Field */}
                                <View style={styles.fieldContainer}>
                                    <Text style={styles.label}>
                                        Password <Text style={styles.required}>*</Text>
                                    </Text>
                                    <View style={styles.inputContainer}>
                                        <TextInput
                                            style={[
                                                styles.input,
                                                errors.password ? styles.inputError : null,
                                                focusedField === 'password' ? styles.inputFocused : null,
                                            ]}
                                            value={formData.password}
                                            onChangeText={(text) => {
                                                setFormData({ ...formData, password: text });
                                                if (errors.password) {
                                                    setErrors({ ...errors, password: '' });
                                                }
                                            }}
                                            onFocus={() => setFocusedField('password')}
                                            onBlur={() => setFocusedField(null)}
                                            placeholder="Minimum 8 characters"
                                            secureTextEntry
                                            editable={!loading}
                                            placeholderTextColor={Colors.neutral[400]}
                                        />
                                    </View>
                                    {errors.password && (
                                        <Text style={styles.errorText}>{errors.password}</Text>
                                    )}
                                    <Text style={styles.helperText}>
                                        The user will receive login credentials via email
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={handleCancel}
                            disabled={loading}
                        >
                            <Text style={[styles.buttonText, styles.cancelButtonText]}>
                                Cancel
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.button,
                                styles.submitButton,
                                loading ? styles.submitButtonDisabled : null,
                            ]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color={Colors.white} size="small" />
                            ) : (
                                <>
                                    <IconSymbol name="checkmark" size={18} color={Colors.white} />
                                    <Text style={[styles.buttonText, styles.submitButtonText]}>
                                        Create User
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ThemedView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BrandColors.surface,
    },
    scrollView: {
        flex: 1,
    },
    customHeader: {
        backgroundColor: BrandColors.surface,
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.sm,
    },
    headerTitle: {
        fontSize: Typography.fontSize.xl,
        fontFamily: Typography.fontFamily.bold,
        color: BrandColors.title,
        flex: 1,
    },
    content: {
        flex: 1,
        paddingTop: Spacing.sm,
    },
    formCard: {
        backgroundColor: Colors.white,
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.lg,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        ...Shadows.md,
    },
    formSection: {
        marginBottom: Spacing.lg,
    },
    sectionTitle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold as any,
        color: BrandColors.ink,
        marginBottom: Spacing.md,
        letterSpacing: -0.3,
    },
    fieldContainer: {
        marginBottom: Spacing.md,
    },
    label: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.semibold as any,
        color: Colors.neutral[700],
        marginBottom: Spacing.sm,
        letterSpacing: 0.1,
    },
    required: {
        color: Colors.error[500],
    },
    inputContainer: {
        position: 'relative',
    },
    input: {
        borderWidth: 1,
        borderColor: Colors.neutral[300],
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        fontSize: Typography.fontSize.base,
        backgroundColor: Colors.white,
        color: BrandColors.ink,
        fontWeight: Typography.fontWeight.medium as any,
        ...Shadows.sm,
    },
    inputFocused: {
        borderColor: BrandColors.primary,
        ...Shadows.md,
    },
    inputError: {
        borderColor: Colors.error[500],
        backgroundColor: Colors.error[50],
    },
    errorText: {
        fontSize: Typography.fontSize.xs,
        color: Colors.error[500],
        marginTop: 6,
        fontWeight: Typography.fontWeight.medium as any,
    },
    helperText: {
        fontSize: Typography.fontSize.xs,
        color: Colors.neutral[500],
        marginTop: 6,
        lineHeight: 18,
    },
    actions: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.xl,
        gap: Spacing.md,
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: Spacing.lg,
        borderRadius: BorderRadius.md,
        gap: 6,
        ...Shadows.sm,
    },
    cancelButton: {
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.neutral[300],
    },
    cancelButtonText: {
        color: Colors.neutral[600],
        fontWeight: Typography.fontWeight.semibold as any,
        fontSize: Typography.fontSize.base,
    },
    submitButton: {
        backgroundColor: BrandColors.primary,
    },
    submitButtonDisabled: {
        backgroundColor: Colors.neutral[400],
        shadowOpacity: 0.05,
    },
    submitButtonText: {
        color: Colors.white,
        fontWeight: Typography.fontWeight.bold as any,
        fontSize: Typography.fontSize.base,
        letterSpacing: 0.2,
    },
    buttonText: {
        fontSize: Typography.fontSize.base,
    },
    actionCard: {
        backgroundColor: BrandColors.surface,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: BrandColors.ink + '10',
        padding: Spacing.md,
        alignItems: 'center',
        marginHorizontal: Spacing.lg,
        marginTop: 0,
        marginBottom: Spacing.sm,
        ...Shadows.sm,
    },
    primaryActionCard: {
        borderColor: BrandColors.primary + '30',
        backgroundColor: BrandColors.surface,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.xs,
    },
    primaryIconContainer: {
        backgroundColor: BrandColors.primary + '10',
    },
    actionTitle: {
        fontSize: Typography.fontSize.base,
        fontFamily: Typography.fontFamily.bold,
        color: BrandColors.ink,
        marginTop: Spacing.xs,
        textAlign: 'center',
    },
    actionSubtitle: {
        fontSize: Typography.fontSize.xs,
        fontFamily: Typography.fontFamily.regular,
        color: Colors.neutral[500],
        marginTop: 4,
        textAlign: 'center',
    },
    // Custom Dropdown Styles
    dropdownButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: Colors.neutral[300],
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        backgroundColor: Colors.white,
        ...Shadows.sm,
    },
    dropdownButtonText: {
        fontSize: Typography.fontSize.base,
        color: BrandColors.ink,
        fontWeight: Typography.fontWeight.medium as any,
        flex: 1,
    },
    dropdownPlaceholder: {
        color: Colors.neutral[400],
    },
    dropdownDisabled: {
        backgroundColor: Colors.neutral[100],
        opacity: 0.6,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    modalContent: {
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.lg,
        width: '100%',
        maxHeight: '70%',
        ...Shadows.lg,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.neutral[200],
    },
    modalTitle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold as any,
        color: BrandColors.title,
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.neutral[100],
    },
    modalOptionSelected: {
        backgroundColor: BrandColors.primary + '10',
    },
    modalOptionText: {
        fontSize: Typography.fontSize.base,
        color: BrandColors.ink,
        fontWeight: Typography.fontWeight.medium as any,
        flex: 1,
    },
    modalOptionTextSelected: {
        color: BrandColors.primary,
        fontWeight: Typography.fontWeight.bold as any,
    },
});
