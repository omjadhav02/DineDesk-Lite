import { printToFileAsync } from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Sale, MonthlySummary } from '../types/Sale';

// ░░░ TODAY'S SALES PDF ░░░
export const generateTodaySalesPDF = async (sales: Sale[], total: number) => {
  const totalItems = sales.reduce((sum, s) => sum + s.totalItems, 0);

  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-GB');
  const dayOfWeek = now.toLocaleDateString('en-GB', { weekday: 'long' });
  const formattedTime = now.toLocaleTimeString('en-GB').replace(/:/g, '-');
  const fileName = `Todays_Sales_${formattedDate.replace(/\//g, '-')}_${formattedTime}.pdf`;

  const htmlContent = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th, td {
            border: 1px solid #444;
            padding: 4px;
            font-size: 10px;
            text-align: center;
            word-wrap: break-word;
          }
          th { background-color: #f2f2f2; }
          h2, h4 { text-align: center; margin: 2px 0; }
        </style>
      </head>
      <body>
        <h2>Today’s Sales Report</h2>
        <h4>${dayOfWeek}, ${formattedDate}</h4>

        <table>
          <tr>
            <th style="width: 5%;">#</th>
            <th style="width: 10%;">Table</th>
            <th style="width: 13%;">Time</th>
            <th style="width: 10%;">Items</th>
            <th style="width: 42%;">Item Names</th>
            <th style="width: 20%;">Total Price</th>
          </tr>
          ${sales.map((sale, idx) => {
            const timeOnly = new Date(sale.timestamp).toLocaleTimeString('en-GB');
            const itemSummary = sale.items.map(i => `${i.itemName} × ${i.quantity}`).join(', ');
            return `
              <tr>
                <td>${idx + 1}</td>
                <td>${sale.tableNumber ?? '-'}</td>
                <td>${timeOnly}</td>
                <td>${sale.totalItems}</td>
                <td style="text-align:left;">${itemSummary}</td>
                <td>₹${sale.totalPrice.toFixed(2)}</td>
              </tr>`;
          }).join('')}
        </table>

        <div class="footer-box">
          <p style="margin-top: 20px; font-size: 12px; text-align: left; line-height: 1.6;">
            <strong>Total Orders:</strong> ${sales.length}<br />
            <strong>Total Items:</strong> ${totalItems}<br />
            <strong>Total Revenue:</strong> ₹${total.toFixed(2)}
          </p>
        </div>

        <p style="text-align:center;font-size:10px;margin-top:30px;color:#777;">Powered by M-31</p>
      </body>
    </html>
  `;

  const { uri } = await printToFileAsync({ html: htmlContent });
  const newPath = FileSystem.documentDirectory + fileName;
  await FileSystem.moveAsync({ from: uri, to: newPath });
  return newPath;
};

// ░░░ MONTHLY SALES PDF ░░░
export const generateMonthlySalesPDF = async (sales: Sale[], monthName: string) => {
  const groupedByDay = new Map<string, { items: number; orders: number; revenue: number }>();

  for (const sale of sales) {
    const date = new Date(sale.timestamp);
    const key = date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const day = date.toLocaleDateString('en-GB', { weekday: 'short' });
    const mapKey = `${key} (${day})`;

    if (!groupedByDay.has(mapKey)) {
      groupedByDay.set(mapKey, {
        items: sale.totalItems,
        orders: 1,
        revenue: sale.totalPrice,
      });
    } else {
      const prev = groupedByDay.get(mapKey)!;
      groupedByDay.set(mapKey, {
        items: prev.items + sale.totalItems,
        orders: prev.orders + 1,
        revenue: prev.revenue + sale.totalPrice,
      });
    }
  }

  const dailyData = Array.from(groupedByDay.entries()).map(([date, stats], idx) => ({
    sr: idx + 1,
    date,
    items: stats.items,
    orders: stats.orders,
    revenue: stats.revenue.toFixed(2),
  }));

  const totalItems = dailyData.reduce((sum, d) => sum + d.items, 0);
  const totalOrders = dailyData.reduce((sum, d) => sum + d.orders, 0);
  const totalRevenue = dailyData.reduce((sum, d) => sum + parseFloat(d.revenue), 0);

  const fileName = `Monthly_Sales_${monthName.replace(/\s/g, '_')}.pdf`;

  const rowsHTML = dailyData.map(row => `
    <tr>
      <td>${row.sr}</td>
      <td>${row.date}</td>
      <td>${row.items}</td>
      <td>${row.orders}</td>
      <td>₹${row.revenue}</td>
    </tr>
  `).join('');

  const htmlContent = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th, td {
            border: 1px solid #444;
            padding: 4px;
            font-size: 10px;
            text-align: center;
            word-wrap: break-word;
          }
          th { background-color: #f2f2f2; }
          h2, h4 { text-align: center; margin: 2px 0; }
        </style>
      </head>
      <body>
        <h2>Monthly Sales Report</h2>
        <h4>${monthName}</h4>

        <table>
          <tr>
            <th style="width:5%;">#</th>
            <th style="width:35%;">Date & Day</th>
            <th style="width:15%;">Items</th>
            <th style="width:15%;">Orders</th>
            <th style="width:30%;">Revenue</th>
          </tr>
          ${rowsHTML}
        </table>

        <div class="footer">
          <p><strong>Monthly Items:</strong> ${totalItems}</p>
          <p><strong>Monthly Orders:</strong> ${totalOrders}</p>
          <p><strong>Monthly Revenue:</strong> ₹${totalRevenue.toFixed(2)}</p>
        </div>

        <p style="text-align:center;font-size:10px;margin-top:30px;color:#777;">Powered by M-31</p>
      </body>
    </html>
  `;

  const { uri } = await printToFileAsync({ html: htmlContent });
  const newPath = FileSystem.documentDirectory + fileName;
  await FileSystem.moveAsync({ from: uri, to: newPath });
  return newPath;
};

// ░░░ YEARLY SALES PDF ░░░
export const generateYearlySalesPDF = async (
  summaries: MonthlySummary[],
  year: number
) => {
  const fileName = `Yearly_Sales_${year}.pdf`;

  const totalItems = summaries.reduce((sum, m) => sum + m.totalItems, 0);
  const totalOrders = summaries.reduce((sum, m) => sum + m.totalOrders, 0);
  const totalRevenue = summaries.reduce((sum, m) => sum + m.totalRevenue, 0);

  const rowsHTML = summaries
    .map(
      (row, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${row.month}</td>
        <td>${row.totalItems}</td>
        <td>${row.totalOrders}</td>
        <td>₹${row.totalRevenue.toFixed(2)}</td>
      </tr>
    `
    )
    .join('');

  const htmlContent = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th, td {
            border: 1px solid #444;
            padding: 4px;
            font-size: 10px;
            text-align: center;
          }
          th { background-color: #f2f2f2; }
          h2, h4 { text-align: center; margin: 2px 0; }
          .footer {
            font-size: 12px;
            margin-top: 16px;
            text-align: left;
          }
        </style>
      </head>
      <body>
        <h2>Yearly Sales Report</h2>
        <h4>${year}</h4>

        <table>
          <tr>
            <th style="width:5%;">#</th>
            <th style="width:35%;">Month</th>
            <th style="width:15%;">Items</th>
            <th style="width:15%;">Orders</th>
            <th style="width:30%;">Revenue</th>
          </tr>
          ${rowsHTML}
        </table>

        <div class="footer">
          <p><strong>Total Items:</strong> ${totalItems}</p>
          <p><strong>Total Orders:</strong> ${totalOrders}</p>
          <p><strong>Total Revenue:</strong> ₹${totalRevenue.toFixed(2)}</p>
        </div>

        <p style="text-align:center;font-size:10px;margin-top:30px;color:#777;">Powered by M-31</p>
      </body>
    </html>
  `;

  const { uri } = await printToFileAsync({ html: htmlContent });
  const newPath = FileSystem.documentDirectory + fileName;

  await FileSystem.moveAsync({ from: uri, to: newPath });
  return newPath;
};

export const generateSingleDaySalesPDF = async (
  sales: Sale[],
  label: string
): Promise<string> => {
  const dateLabel = label.replace(/\s+/g, '_'); // For file naming
  const fileName = `Sales_Report_${dateLabel}.pdf`;

  const totalItems = sales.reduce((sum, s) => sum + s.totalItems, 0);
  const totalOrders = sales.length;
  const totalRevenue = sales.reduce((sum, s) => sum + s.totalPrice, 0);

  const rowsHTML = sales
    .map((sale, idx) => {
      const timeOnly = new Date(sale.timestamp).toLocaleTimeString('en-GB');
      const itemSummary = sale.items.map(i => `${i.itemName} × ${i.quantity}`).join(', ');

      return `
        <tr>
          <td>${idx + 1}</td>
          <td>${sale.tableNumber ?? '-'}</td>
          <td>${timeOnly}</td>
          <td>${sale.totalItems}</td>
          <td style="text-align:left;">${itemSummary}</td>
          <td>₹${sale.totalPrice.toFixed(2)}</td>
        </tr>`;
    })
    .join('');

  const htmlContent = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th, td {
            border: 1px solid #444;
            padding: 4px;
            font-size: 10px;
            text-align: center;
            word-wrap: break-word;
          }
          th { background-color: #f2f2f2; }
          h2, h4 { text-align: center; margin: 2px 0; }
          .footer {
            font-size: 12px;
            margin-top: 16px;
            text-align: left;
          }
        </style>
      </head>
      <body>
        <h2>Daily Sales Report</h2>
        <h4>${label}</h4>

        <table>
          <tr>
            <th style="width: 5%;">#</th>
            <th style="width: 10%;">Table</th>
            <th style="width: 13%;">Time</th>
            <th style="width: 10%;">Items</th>
            <th style="width: 42%;">Item Names</th>
            <th style="width: 20%;">Total Price</th>
          </tr>
          ${rowsHTML}
        </table>

        <div class="footer">
          <p><strong>Total Orders:</strong> ${totalOrders}</p>
          <p><strong>Total Items:</strong> ${totalItems}</p>
          <p><strong>Total Revenue:</strong> ₹${totalRevenue.toFixed(2)}</p>
        </div>

        <p style="text-align:center;font-size:10px;margin-top:30px;color:#777;">Powered by DineDesk</p>
      </body>
    </html>
  `;

  const { uri } = await printToFileAsync({ html: htmlContent });
  const newPath = FileSystem.documentDirectory + fileName;

  await FileSystem.moveAsync({ from: uri, to: newPath });
  return newPath;
};

// ░░░ ALL-TIME SALES PDF ░░░
export const generateAllTimeSalesPDF = async (
  yearlySummaries: { year: number; totalItems: number; totalOrders: number; totalRevenue: number }[]
) => {
  const totalItems = yearlySummaries.reduce((sum, y) => sum + y.totalItems, 0);
  const totalOrders = yearlySummaries.reduce((sum, y) => sum + y.totalOrders, 0);
  const totalRevenue = yearlySummaries.reduce((sum, y) => sum + y.totalRevenue, 0);

  const fileName = `AllTime_Sales_Report.pdf`;

  const rowsHTML = yearlySummaries
    .map(
      (row, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td>${row.year}</td>
          <td>${row.totalItems}</td>
          <td>${row.totalOrders}</td>
          <td>₹${row.totalRevenue.toFixed(2)}</td>
        </tr>
      `
    )
    .join('');

  const htmlContent = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th, td {
            border: 1px solid #444;
            padding: 4px;
            font-size: 10px;
            text-align: center;
          }
          th { background-color: #f2f2f2; }
          h2, h4 { text-align: center; margin: 2px 0; }
          .footer {
            font-size: 12px;
            margin-top: 16px;
            text-align: left;
          }
        </style>
      </head>
      <body>
        <h2>All-Time Sales Report</h2>

        <table>
          <tr>
            <th style="width:5%;">#</th>
            <th style="width:20%;">Year</th>
            <th style="width:20%;">Items</th>
            <th style="width:20%;">Orders</th>
            <th style="width:35%;">Revenue</th>
          </tr>
          ${rowsHTML}
        </table>

        <div class="footer">
          <p><strong>Total Items:</strong> ${totalItems}</p>
          <p><strong>Total Orders:</strong> ${totalOrders}</p>
          <p><strong>Total Revenue:</strong> ₹${totalRevenue.toFixed(2)}</p>
        </div>

        <p style="text-align:center;font-size:10px;margin-top:30px;color:#777;">Powered by M-31</p>
      </body>
    </html>
  `;

  const { uri } = await printToFileAsync({ html: htmlContent });
  const newPath = FileSystem.documentDirectory + fileName;

  await FileSystem.moveAsync({ from: uri, to: newPath });
  return newPath;
};



// ░░░ WEEKLY SALES PDF ░░░
export const generateWeeklySalesPDF = async (sales: Sale[], weekLabel: string) => {
  const groupedByDay = new Map<string, { items: number; orders: number; revenue: number }>();

  for (const sale of sales) {
    const date = new Date(sale.timestamp);
    const key = date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const day = date.toLocaleDateString('en-GB', { weekday: 'short' });
    const mapKey = `${key} (${day})`;

    if (!groupedByDay.has(mapKey)) {
      groupedByDay.set(mapKey, {
        items: sale.totalItems,
        orders: 1,
        revenue: sale.totalPrice,
      });
    } else {
      const prev = groupedByDay.get(mapKey)!;
      groupedByDay.set(mapKey, {
        items: prev.items + sale.totalItems,
        orders: prev.orders + 1,
        revenue: prev.revenue + sale.totalPrice,
      });
    }
  }

  const dailyData = Array.from(groupedByDay.entries()).map(([date, stats], idx) => ({
    sr: idx + 1,
    date,
    items: stats.items,
    orders: stats.orders,
    revenue: stats.revenue.toFixed(2),
  }));

  const totalItems = dailyData.reduce((sum, d) => sum + d.items, 0);
  const totalOrders = dailyData.reduce((sum, d) => sum + d.orders, 0);
  const totalRevenue = dailyData.reduce((sum, d) => sum + parseFloat(d.revenue), 0);

  const fileName = `Weekly_Sales_${weekLabel.replace(/\s/g, '_')}.pdf`;

  const rowsHTML = dailyData.map(row => `
    <tr>
      <td>${row.sr}</td>
      <td>${row.date}</td>
      <td>${row.items}</td>
      <td>${row.orders}</td>
      <td>₹${row.revenue}</td>
    </tr>
  `).join('');

  const htmlContent = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th, td {
            border: 1px solid #444;
            padding: 4px;
            font-size: 10px;
            text-align: center;
            word-wrap: break-word;
          }
          th { background-color: #f2f2f2; }
          h2, h4 { text-align: center; margin: 2px 0; }
        </style>
      </head>
      <body>
        <h2>Weekly Sales Report</h2>
        <h4>${weekLabel}</h4>

        <table>
          <tr>
            <th style="width:5%;">#</th>
            <th style="width:35%;">Date & Day</th>
            <th style="width:15%;">Items</th>
            <th style="width:15%;">Orders</th>
            <th style="width:30%;">Revenue</th>
          </tr>
          ${rowsHTML}
        </table>

        <div class="footer">
          <p><strong>Weekly Items:</strong> ${totalItems}</p>
          <p><strong>Weekly Orders:</strong> ${totalOrders}</p>
          <p><strong>Weekly Revenue:</strong> ₹${totalRevenue.toFixed(2)}</p>
        </div>

        <p style="text-align:center;font-size:10px;margin-top:30px;color:#777;">Powered by M-31</p>
      </body>
    </html>
  `;

  const { uri } = await printToFileAsync({ html: htmlContent });
  const newPath = FileSystem.documentDirectory + fileName;
  await FileSystem.moveAsync({ from: uri, to: newPath });
  return newPath;
};
