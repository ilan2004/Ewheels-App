customers table 
[
  {
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "name",
    "data_type": "character varying",
    "is_nullable": "NO",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "contact",
    "data_type": "character varying",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "phone",
    "data_type": "character varying",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "email",
    "data_type": "character varying",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "address",
    "data_type": "text",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "city",
    "data_type": "character varying",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "state",
    "data_type": "character varying",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "postal_code",
    "data_type": "character varying",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "gst_number",
    "data_type": "text",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "alt_contact",
    "data_type": "text",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "notes",
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
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "updated_by",
    "data_type": "uuid",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  }
]
invoices table 
[
  {
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "number",
    "data_type": "text",
    "is_nullable": "NO",
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
    "column_name": "customer",
    "data_type": "jsonb",
    "is_nullable": "NO",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "totals",
    "data_type": "jsonb",
    "is_nullable": "NO",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "currency",
    "data_type": "text",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "balance_due",
    "data_type": "numeric",
    "is_nullable": "NO",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "due_date",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "notes",
    "data_type": "text",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "terms",
    "data_type": "text",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "source_quote_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "foreign_table_name": "quotes",
    "foreign_column_name": "id"
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
  }
]
inventory_items table 
[
  {
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "sku",
    "data_type": "character varying",
    "is_nullable": "NO",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "name",
    "data_type": "character varying",
    "is_nullable": "NO",
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
    "column_name": "item_type",
    "data_type": "USER-DEFINED",
    "is_nullable": "NO",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "category",
    "data_type": "character varying",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "subcategory",
    "data_type": "character varying",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "item_condition",
    "data_type": "USER-DEFINED",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "unit_of_measure",
    "data_type": "character varying",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "weight_kg",
    "data_type": "numeric",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "dimensions",
    "data_type": "jsonb",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "cost_price",
    "data_type": "numeric",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "sale_price",
    "data_type": "numeric",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "service_price",
    "data_type": "numeric",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "current_stock",
    "data_type": "integer",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "reserved_stock",
    "data_type": "integer",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "min_stock_level",
    "data_type": "integer",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "max_stock_level",
    "data_type": "integer",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "reorder_point",
    "data_type": "integer",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "estimated_duration_minutes",
    "data_type": "integer",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "requires_technician",
    "data_type": "boolean",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "service_category",
    "data_type": "character varying",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "is_sellable",
    "data_type": "boolean",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "is_purchasable",
    "data_type": "boolean",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "track_serial_numbers",
    "data_type": "boolean",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "status",
    "data_type": "character varying",
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
    "column_name": "supplier_info",
    "data_type": "jsonb",
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
  }
]

sales table .
[
  {
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "invoice_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "foreign_table_name": "invoices",
    "foreign_column_name": "id"
  },
  {
    "column_name": "service_ticket_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "foreign_table_name": "service_tickets",
    "foreign_column_name": "id"
  },
  {
    "column_name": "customer_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "sale_number",
    "data_type": "character varying",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "sale_date",
    "data_type": "date",
    "is_nullable": "NO",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "sale_type",
    "data_type": "character varying",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "subtotal",
    "data_type": "numeric",
    "is_nullable": "NO",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "tax_amount",
    "data_type": "numeric",
    "is_nullable": "NO",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "discount_amount",
    "data_type": "numeric",
    "is_nullable": "NO",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "total_amount",
    "data_type": "numeric",
    "is_nullable": "NO",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "payment_method",
    "data_type": "USER-DEFINED",
    "is_nullable": "NO",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "payment_status",
    "data_type": "character varying",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "paid_amount",
    "data_type": "numeric",
    "is_nullable": "NO",
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
    "column_name": "notes",
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
    "column_name": "customer_name",
    "data_type": "character varying",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  }
]


expenses tables 

[
  {
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "expense_number",
    "data_type": "character varying",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "expense_date",
    "data_type": "date",
    "is_nullable": "NO",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "category",
    "data_type": "USER-DEFINED",
    "is_nullable": "NO",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "amount",
    "data_type": "numeric",
    "is_nullable": "NO",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "tax_amount",
    "data_type": "numeric",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "total_amount",
    "data_type": "numeric",
    "is_nullable": "NO",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "payment_method",
    "data_type": "USER-DEFINED",
    "is_nullable": "NO",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "payment_reference",
    "data_type": "character varying",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "vendor_name",
    "data_type": "character varying",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "vendor_contact",
    "data_type": "character varying",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "invoice_number",
    "data_type": "character varying",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "description",
    "data_type": "text",
    "is_nullable": "NO",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "purpose",
    "data_type": "text",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "notes",
    "data_type": "text",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "approval_status",
    "data_type": "character varying",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "approved_by",
    "data_type": "uuid",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "approved_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "receipt_number",
    "data_type": "character varying",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "document_path",
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
  }
]