SELECT string_agg(line, E'\n' ORDER BY grp, table_name, ordinal_position) AS schema_clipboard
FROM (
    SELECT
        0 AS grp,
        NULL::text AS table_name,
        0 AS ordinal_position,
        'table.column | data_type | nullable | default' AS line
    UNION ALL
    SELECT
        1 AS grp,
        table_name,
        ordinal_position,
        format(
            '%s.%s | %s | %s | %s',
            table_name,
            column_name,
            data_type,
            is_nullable,
            COALESCE(column_default, 'NULL')
        ) AS line
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN (
          'projects',
          'material_emissions',
          'epd_australasia',
          'suppliers',
          'bim_elements'
      )
) AS lines;
