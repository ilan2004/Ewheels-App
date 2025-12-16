vehicle cases table 
[
  {
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "service_ticket_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "foreign_table_name": "service_tickets",
    "foreign_column_name": "id"
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
    "column_name": "customer_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "foreign_table_name": "customers",
    "foreign_column_name": "id"
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
    "column_name": "initial_diagnosis",
    "data_type": "text",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "symptoms_observed",
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
    "column_name": "parts_required",
    "data_type": "ARRAY",
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
    "column_name": "labor_hours",
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
    "column_name": "assigned_technician",
    "data_type": "uuid",
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
    "column_name": "vehicle_type",
    "data_type": "USER-DEFINED",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  }
]

Battery cases 
[
  {
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "service_ticket_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "foreign_table_name": "service_tickets",
    "foreign_column_name": "id"
  },
  {
    "column_name": "battery_record_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "foreign_table_name": "battery_records",
    "foreign_column_name": "id"
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
    "data_type": "character varying",
    "is_nullable": "YES",
    "foreign_table_name": null,
    "foreign_column_name": null
  },
  {
    "column_name": "repair_type",
    "data_type": "character varying",
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
    "column_name": "parts_required",
    "data_type": "ARRAY",
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
    "column_name": "labor_hours",
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
    "column_name": "assigned_technician",
    "data_type": "uuid",
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
  }
]