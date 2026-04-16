import pool from '../db';

/**
 * Export KPI data to CSV format
 */
export const exportKPIToCSV = async (): Promise<string> => {
  try {
    // Fetch all KPIs with related data
    const [kpis]: any = await pool.query(
      `SELECT 
        k.id as kpi_id,
        k.period_year,
        k.period_month,
        k.status,
        k.submitted_at,
        k.completed_at,
        COALESCE(e.employee_id, CONCAT('EMP', e.id)) as employee_id,
        e.first_name,
        e.last_name,
        e.email,
        d.name as department,
        des.name as designation,
        ac.name as category_name,
        GROUP_CONCAT(
          CONCAT(
            ki.title, '|',
            COALESCE(ki.description, ''), '|',
            ki.weight, '|',
            ki.employee_target, '|',
            COALESCE(ki.employee_self_score, ''), '|',
            COALESCE(ki.manager_score, ''), '|',
            COALESCE(ki.dept_head_score, ''), '|',
            COALESCE(ki.hr_score, ''), '|',
            COALESCE(ki.ceo_score, '')
          ) SEPARATOR ';;'
        ) as kpi_items,
        GROUP_CONCAT(
          CONCAT(
            CONCAT(rev.first_name, ' ', rev.last_name), '|',
            kr.reviewer_role, '|',
            kr.action, '|',
            kr.from_status, '|',
            kr.to_status, '|',
            COALESCE(kr.overall_score, ''), '|',
            COALESCE(kr.overall_comment, ''), '|',
            kr.created_at
          ) SEPARATOR ';;'
        ) as reviews,
        GROUP_CONCAT(
          CONCAT(
            CONCAT(com.first_name, ' ', com.last_name), '|',
            kc.author_role, '|',
            kc.message, '|',
            kc.created_at
          ) SEPARATOR ';;'
        ) as comments
      FROM hrms_kpis k
      JOIN hrms_employees e ON k.employee_id = e.id
      JOIN hrms_departments d ON e.department_id = d.id
      JOIN hrms_designations des ON e.designation_id = des.id
      JOIN hrms_appraisal_categories ac ON k.appraisal_category_id = ac.id
      LEFT JOIN hrms_kpi_items ki ON k.id = ki.kpi_id
      LEFT JOIN hrms_kpi_reviews kr ON k.id = kr.kpi_id
      LEFT JOIN hrms_employees rev ON kr.reviewer_id = rev.id
      LEFT JOIN hrms_kpi_comments kc ON k.id = kc.kpi_id
      LEFT JOIN hrms_employees com ON kc.author_id = com.id
      GROUP BY k.id, k.period_year, k.period_month, k.status, k.submitted_at, k.completed_at,
               e.employee_id, e.first_name, e.last_name, e.email, d.name, des.name, ac.name
      ORDER BY k.created_at DESC`
    );

    // Create CSV header
    const headers = [
      'KPI ID',
      'Employee ID',
      'Employee Name',
      'Email',
      'Department',
      'Designation',
      'Period Year',
      'Period Month',
      'Category',
      'Status',
      'Submitted At',
      'Completed At',
      'KPI Items (Title|Description|Weight|Target|Employee Score|Manager Score|Dept Head Score|HR Score|CEO Score)',
      'Approval History (Reviewer|Role|Action|From Status|To Status|Overall Score|Comment|Date)',
      'Comments (Author|Role|Message|Date)'
    ];

    // Create CSV rows
    const rows = kpis.map((kpi: any) => {
      return [
        kpi.kpi_id,
        kpi.employee_id,
        `${kpi.first_name} ${kpi.last_name}`,
        kpi.email || '',
        kpi.department,
        kpi.designation,
        kpi.period_year,
        kpi.period_month,
        kpi.category_name,
        kpi.status,
        kpi.submitted_at ? new Date(kpi.submitted_at).toLocaleString() : '',
        kpi.completed_at ? new Date(kpi.completed_at).toLocaleString() : '',
        (kpi.kpi_items || '').replace(/,/g, ';'),
        (kpi.reviews || '').replace(/,/g, ';'),
        (kpi.comments || '').replace(/,/g, ';')
      ];
    });

    // Generate CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map((row: any[]) => row.map((cell: any) => {
        // Escape commas and quotes in CSV
        const cellStr = String(cell || '');
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(','))
    ].join('\n');

    return csvContent;
  } catch (error) {
    console.error('Error exporting KPI to CSV:', error);
    throw error;
  }
};

/**
 * Export Asset data to CSV format
 */
export const exportAssetsToCSV = async (): Promise<string> => {
  try {
    // Fetch all assets with related data
    const [assets]: any = await pool.query(
      `SELECT 
        a.id,
        a.asset_id,
        a.name,
        a.category,
        a.type,
        a.brand,
        a.model,
        a.serial_number,
        a.purchase_date,
        a.purchase_price,
        a.current_value,
        a.vendor_name,
        a.invoice_number,
        a.depreciation_method,
        a.depreciation_rate,
        a.useful_life_years,
        a.condition,
        a.status,
        a.location,
        a.warranty_expiry,
        a.description,
        a.specifications,
        COALESCE(e.employee_id, CONCAT('EMP', e.id)) as assigned_employee_id,
        CONCAT(e.first_name, ' ', e.last_name) as assigned_employee_name,
        a.assignment_date,
        GROUP_CONCAT(
          CONCAT(
            ap.photo_name, '|',
            ap.photo_path, '|',
            CASE WHEN ap.is_primary = 1 THEN 'Yes' ELSE 'No' END
          ) SEPARATOR ';;'
        ) as photos,
        GROUP_CONCAT(
          CONCAT(
            ah.action_type, '|',
            CONCAT(emp.first_name, ' ', emp.last_name), '|',
            ah.action_date, '|',
            COALESCE(ah.description, ''), '|',
            COALESCE(ah.remarks, '')
          ) SEPARATOR ';;'
        ) as history,
        GROUP_CONCAT(
          CONCAT(
            CONCAT(ass_emp.first_name, ' ', ass_emp.last_name), '|',
            aa.assigned_date, '|',
            COALESCE(aa.return_date, ''), '|',
            aa.condition, '|',
            aa.status
          ) SEPARATOR ';;'
        ) as assignments
      FROM hrms_assets a
      LEFT JOIN hrms_employees e ON a.assigned_to = e.id
      LEFT JOIN hrms_asset_photos ap ON a.id = ap.asset_id
      LEFT JOIN hrms_asset_history ah ON a.id = ah.asset_id
      LEFT JOIN hrms_users u ON ah.action_by = u.id
      LEFT JOIN hrms_employees emp ON u.employee_id = emp.id
      LEFT JOIN hrms_asset_assignments aa ON a.id = aa.asset_id
      LEFT JOIN hrms_employees ass_emp ON aa.employee_id = ass_emp.id
      WHERE a.is_active = 1
      GROUP BY a.id, a.asset_id, a.name, a.category, a.type, a.brand, a.model, a.serial_number,
               a.purchase_date, a.purchase_price, a.current_value, a.vendor_name, a.invoice_number,
               a.depreciation_method, a.depreciation_rate, a.useful_life_years, a.condition, a.status,
               a.location, a.warranty_expiry, a.description, a.specifications,
               e.employee_id, e.first_name, e.last_name, a.assignment_date
      ORDER BY a.created_at DESC`
    );

    // Create CSV header
    const headers = [
      'Asset ID',
      'Name',
      'Category',
      'Type',
      'Brand',
      'Model',
      'Serial Number',
      'Purchase Date',
      'Purchase Price',
      'Current Value',
      'Vendor Name',
      'Invoice Number',
      'Depreciation Method',
      'Depreciation Rate (%)',
      'Useful Life (Years)',
      'Condition',
      'Status',
      'Location',
      'Warranty Expiry',
      'Assigned To (Employee ID)',
      'Assigned To (Name)',
      'Assignment Date',
      'Description',
      'Specifications',
      'Photos (Name|Path|Is Primary)',
      'History (Action|By|Date|Description|Remarks)',
      'Assignments (Employee|Assigned Date|Return Date|Condition|Status)'
    ];

    // Create CSV rows
    const rows = assets.map((asset: any) => {
      return [
        asset.asset_id,
        asset.name,
        asset.category,
        asset.type,
        asset.brand || '',
        asset.model || '',
        asset.serial_number || '',
        asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : '',
        asset.purchase_price ? parseFloat(asset.purchase_price).toFixed(2) : '',
        asset.current_value ? parseFloat(asset.current_value).toFixed(2) : '',
        asset.vendor_name || '',
        asset.invoice_number || '',
        asset.depreciation_method || '',
        asset.depreciation_rate ? parseFloat(asset.depreciation_rate).toFixed(2) : '',
        asset.useful_life_years || '',
        asset.condition,
        asset.status,
        asset.location || '',
        asset.warranty_expiry ? new Date(asset.warranty_expiry).toLocaleDateString() : '',
        asset.assigned_employee_id || '',
        asset.assigned_employee_name || '',
        asset.assignment_date ? new Date(asset.assignment_date).toLocaleDateString() : '',
        asset.description || '',
        asset.specifications || '',
        (asset.photos || '').replace(/,/g, ';'),
        (asset.history || '').replace(/,/g, ';'),
        (asset.assignments || '').replace(/,/g, ';')
      ];
    });

    // Generate CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map((row: any[]) => row.map((cell: any) => {
        const cellStr = String(cell || '');
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(','))
    ].join('\n');

    return csvContent;
  } catch (error) {
    console.error('Error exporting Assets to CSV:', error);
    throw error;
  }
};

/**
 * Export Employee Forms (Leave, Expense) to CSV
 */
export const exportEmployeeFormsToCSV = async (formType: string): Promise<string> => {
  try {
    let query = '';
    let headers: string[] = [];

    if (formType.toUpperCase() === 'LEAVE') {
      query = `SELECT 
        lr.id,
        COALESCE(e.employee_id, CONCAT('EMP', e.id)) as employee_id,
        CONCAT(e.first_name, ' ', e.last_name) as employee_name,
        e.email,
        d.name as department,
        des.name as designation,
        lt.name as leave_type,
        lr.start_date,
        lr.end_date,
        DATEDIFF(lr.end_date, lr.start_date) + 1 as days,
        lr.reason,
        lr.status,
        lr.created_at as submitted_at,
        lr.updated_at as approved_at,
        CONCAT(approver.first_name, ' ', approver.last_name) as approved_by_name
      FROM hrms_leave_requests lr
      JOIN hrms_employees e ON lr.employee_id = e.id
      JOIN hrms_departments d ON e.department_id = d.id
      JOIN hrms_designations des ON e.designation_id = des.id
      JOIN hrms_leave_types lt ON lr.leave_type_id = lt.id
      LEFT JOIN hrms_employees approver ON lr.approved_by = approver.id
      ORDER BY lr.created_at DESC`;

      headers = [
        'Request ID',
        'Employee ID',
        'Employee Name',
        'Email',
        'Department',
        'Designation',
        'Leave Type',
        'Start Date',
        'End Date',
        'Days',
        'Reason',
        'Status',
        'Submitted At',
        'Approved At',
        'Approved By'
      ];
    } else if (formType.toUpperCase() === 'EXPENSE') {
      query = `SELECT 
        er.id,
        COALESCE(e.employee_id, CONCAT('EMP', e.id)) as employee_id,
        CONCAT(e.first_name, ' ', e.last_name) as employee_name,
        e.email,
        d.name as department,
        des.name as designation,
        ec.name as expense_category,
        er.amount,
        er.description,
        er.status,
        er.created_at as submitted_at,
        er.updated_at as approved_at,
        CONCAT(approver.first_name, ' ', approver.last_name) as approved_by_name
      FROM hrms_expense_requests er
      JOIN hrms_employees e ON er.employee_id = e.id
      JOIN hrms_departments d ON e.department_id = d.id
      JOIN hrms_designations des ON e.designation_id = des.id
      JOIN hrms_expense_categories ec ON er.expense_category_id = ec.id
      LEFT JOIN hrms_employees approver ON er.approved_by = approver.id
      ORDER BY er.created_at DESC`;

      headers = [
        'Request ID',
        'Employee ID',
        'Employee Name',
        'Email',
        'Department',
        'Designation',
        'Expense Category',
        'Amount',
        'Description',
        'Status',
        'Submitted At',
        'Approved At',
        'Approved By'
      ];
    } else {
      throw new Error(`Unsupported form type: ${formType}`);
    }

    const [forms]: any = await pool.query(query);

    // Create CSV rows
    const rows = forms.map((form: any) => {
      if (formType.toUpperCase() === 'LEAVE') {
        return [
          form.id,
          form.employee_id,
          form.employee_name,
          form.email || '',
          form.department,
          form.designation,
          form.leave_type,
          form.start_date ? new Date(form.start_date).toLocaleDateString() : '',
          form.end_date ? new Date(form.end_date).toLocaleDateString() : '',
          form.days,
          form.reason || '',
          form.status,
          form.submitted_at ? new Date(form.submitted_at).toLocaleString() : '',
          form.approved_at && form.status === 'APPROVED' ? new Date(form.approved_at).toLocaleString() : '',
          form.approved_by_name || ''
        ];
      } else {
        return [
          form.id,
          form.employee_id,
          form.employee_name,
          form.email || '',
          form.department,
          form.designation,
          form.expense_category,
          form.amount ? parseFloat(form.amount).toFixed(2) : '',
          form.description || '',
          form.status,
          form.submitted_at ? new Date(form.submitted_at).toLocaleString() : '',
          form.approved_at && form.status === 'APPROVED' ? new Date(form.approved_at).toLocaleString() : '',
          form.approved_by_name || ''
        ];
      }
    });

    // Generate CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map((row: any[]) => row.map((cell: any) => {
        const cellStr = String(cell || '');
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(','))
    ].join('\n');

    return csvContent;
  } catch (error) {
    console.error(`Error exporting ${formType} forms to CSV:`, error);
    throw error;
  }
};

