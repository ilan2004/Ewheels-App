[
  {
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "ticket_number",
    "data_type": "character varying",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "customer_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "foreign_table_name": "customers",
    "foreign_column_name": "id"
  },
  {
    "column_name": "symptom",
    "data_type": "text",
    "is_nullable": "NO",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "customer_complaint",
    "data_type": "text",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "description",
    "data_type": "text",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "vehicle_make",
    "data_type": "character varying",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "vehicle_model",
    "data_type": "character varying",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "vehicle_reg_no",
    "data_type": "character varying",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "vehicle_year",
    "data_type": "integer",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "status",
    "data_type": "USER-DEFINED",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "priority",
    "data_type": "integer",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "assigned_to",
    "data_type": "uuid",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "assigned_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "assigned_by",
    "data_type": "uuid",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "closed_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "due_date",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "triaged_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "triaged_by",
    "data_type": "uuid",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "triage_notes",
    "data_type": "text",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "location_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "foreign_table_name": "locations",
    "foreign_column_name": "id"
  },
  {
    "column_name": "created_by",
    "data_type": "uuid",
    "is_nullable": "NO",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "updated_by",
    "data_type": "uuid",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "battery_case_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "foreign_table_name": "battery_records",
    "foreign_column_name": "id"
  },
  {
    "column_name": "vehicle_case_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "foreign_table_name": "vehicle_cases",
    "foreign_column_name": "id"
  },
  {
    "column_name": "customer_bringing",
    "data_type": "USER-DEFINED",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "vehicle_record_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "foreign_table_name": "vehicle_records",
    "foreign_column_name": "id"
  },
  {
    "column_name": "battery_case_id_new",
    "data_type": "uuid",
    "is_nullable": "YES",
    "foreign_table_name": "battery_cases",
    "foreign_column_name": "id"
  }
]

vehicle_records table .
[
  {
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "vehicle_make",
    "data_type": "character varying",
    "is_nullable": "NO",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "vehicle_model",
    "data_type": "character varying",
    "is_nullable": "NO",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "vehicle_reg_no",
    "data_type": "character varying",
    "is_nullable": "NO",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "vehicle_year",
    "data_type": "integer",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "vin_number",
    "data_type": "character varying",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "vehicle_type",
    "data_type": "character varying",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "customer_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "foreign_table_name": "customers",
    "foreign_column_name": "id"
  },
  {
    "column_name": "received_date",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "delivered_date",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "status",
    "data_type": "USER-DEFINED",
    "is_nullable": "NO",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "initial_diagnosis",
    "data_type": "text",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "customer_complaint_observed",
    "data_type": "text",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "condition_notes",
    "data_type": "text",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "diagnostic_notes",
    "data_type": "text",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "repair_notes",
    "data_type": "text",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "technician_notes",
    "data_type": "text",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "estimated_cost",
    "data_type": "numeric",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "parts_required",
    "data_type": "ARRAY",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "location_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "foreign_table_name": "locations",
    "foreign_column_name": "id"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "created_by",
    "data_type": "uuid",
    "is_nullable": "NO",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "updated_by",
    "data_type": "uuid",
    "is_nullable": "NO",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "service_ticket_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "foreign_table_name": "service_tickets",
    "foreign_column_name": "id"
  }
]

battery_records table 
[
  {
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "serial_number",
    "data_type": "character varying",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "battery_serial",
    "data_type": "character varying",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "brand",
    "data_type": "character varying",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "battery_make",
    "data_type": "character varying",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "model",
    "data_type": "character varying",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "battery_model",
    "data_type": "character varying",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "battery_type",
    "data_type": "USER-DEFINED",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "voltage",
    "data_type": "numeric",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "capacity",
    "data_type": "numeric",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "cell_type",
    "data_type": "USER-DEFINED",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "cell_count",
    "data_type": "integer",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "customer_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "foreign_table_name": "customers",
    "foreign_column_name": "id"
  },
  {
    "column_name": "customer_complaint",
    "data_type": "text",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "received_date",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "delivered_date",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "status",
    "data_type": "USER-DEFINED",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "initial_voltage",
    "data_type": "numeric",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "load_test_result",
    "data_type": "numeric",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "ir_values",
    "data_type": "ARRAY",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "cell_voltages",
    "data_type": "ARRAY",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "bms_status",
    "data_type": "USER-DEFINED",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "repair_type",
    "data_type": "USER-DEFINED",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "repair_notes",
    "data_type": "text",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "technician_notes",
    "data_type": "text",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "cells_replaced",
    "data_type": "integer",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "rows_replaced",
    "data_type": "integer",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "parts_replaced",
    "data_type": "ARRAY",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "estimated_cost",
    "data_type": "numeric",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "final_cost",
    "data_type": "numeric",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "cost",
    "data_type": "numeric",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "parts_cost",
    "data_type": "numeric",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "labor_cost",
    "data_type": "numeric",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "location_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "foreign_table_name": "locations",
    "foreign_column_name": "id"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "created_by",
    "data_type": "uuid",
    "is_nullable": "NO",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "updated_by",
    "data_type": "uuid",
    "is_nullable": "NO",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "warranty_status",
    "data_type": "character varying",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "warranty_expiry_date",
    "data_type": "date",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "service_ticket_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "foreign_table_name": "service_tickets",
    "foreign_column_name": "id"
  }
]