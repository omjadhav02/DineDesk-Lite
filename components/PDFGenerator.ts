import { printToFileAsync } from 'expo-print';
import * as FileSystem from 'expo-file-system';
import { Sale, MonthlySummary } from '../types/Sale';

const generateHTMLWrapper = (title: string, subHeading: string, body: string, restaurantName: string) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB'); // dd/mm/yyyy
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  return `
  <html>
    <head>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          padding: 24px;
          font-size: 11px;
          color: #333;
          background-color: #fff;
        }
        .top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .invoice-label {
          font-size: 14px;
          font-weight: bold;
          color: #000;
        }
        .date-time {
          font-size: 11px;
          color: #444;
          text-align: right;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 8px;
          margin-bottom: 12px;
        }
        .header h1 {
          font-size: 20px;
          margin: 0;
        }
        .header h2 {
          font-size: 14px;
          margin: 4px 0;
        }
        .header h4 {
          font-size: 12px;
          margin: 0;
          color: #666;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 12px;
        }
        th, td {
          border: 1px solid #ccc;
          padding: 6px 8px;
          font-size: 10px;
          text-align: center;
        }
        th {
          background-color: #f8f8f8;
          font-weight: bold;
        }
        .footer {
          font-size: 12px;
          margin-top: 20px;
          text-align: center;
          line-height: 1.6;
        }
        .powered {
          text-align: center;
          font-size: 10px;
          margin-top: 30px;
          color: #777;
        }
      </style>
    </head>
    <body>

      <div class="top-bar">
        <div class="invoice-label">INVOICE</div>
        <div class="date-time">
          <div><strong>Date:</strong> ${dateStr}</div>
          <div><strong>Time:</strong> ${timeStr}</div>
        </div>
      </div>

      <div class="header">
        <h1>${restaurantName}</h1>
        <h2>${title}</h2>
        <h4>${subHeading}</h4>
      </div>

      ${body}
      <p class="powered">Powered by M-31</p>

    </body>
  </html>
`;
};


export const generateTodaySalesPDF = async (sales: Sale[], total: number, restaurantName: string) => {
  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-GB');
  const dayOfWeek = now.toLocaleDateString('en-GB', { weekday: 'long' });
  const formattedTime = now.toLocaleTimeString('en-GB').replace(/:/g, '-');
  const fileName = `Todays_Sales_${formattedDate.replace(/\//g, '-')}_${formattedTime}.pdf`;

  const rowsHTML = sales.map((sale, idx) => {
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
  }).join('');

  const totalItems = sales.reduce((sum, s) => sum + s.totalItems, 0);

  const body = `
    <table>
      <tr>
        <th>#</th><th>Table</th><th>Time</th><th>Items</th><th>Item Names</th><th>Total Price</th>
      </tr>
      ${rowsHTML}
    </table>
    <div class="footer">
      <p><strong>Total Orders:</strong> ${sales.length}</p>
      <p><strong>Total Items:</strong> ${totalItems}</p>
      <p><strong>Total Revenue:</strong> ₹${total.toFixed(2)}</p>
    </div>
  `;

  const htmlContent = generateHTMLWrapper('Today’s Sales Report', `${dayOfWeek}, ${formattedDate}`, body, restaurantName);
  const { uri } = await printToFileAsync({ html: htmlContent });
  const newPath = FileSystem.documentDirectory + fileName;
  await FileSystem.moveAsync({ from: uri, to: newPath });
  return newPath;
};

export const generateMonthlySalesPDF = async (sales: Sale[], monthName: string, restaurantName: string) => {
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

  const dailyData = Array.from(groupedByDay.entries()).map(([date, stats], idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>${date}</td>
      <td>${stats.items}</td>
      <td>${stats.orders}</td>
      <td>₹${stats.revenue.toFixed(2)}</td>
    </tr>
  `).join('');

  const totalItems = Array.from(groupedByDay.values()).reduce((sum, d) => sum + d.items, 0);
  const totalOrders = Array.from(groupedByDay.values()).reduce((sum, d) => sum + d.orders, 0);
  const totalRevenue = Array.from(groupedByDay.values()).reduce((sum, d) => sum + d.revenue, 0);

  const body = `
    <table>
      <tr><th>#</th><th>Date & Day</th><th>Items</th><th>Orders</th><th>Revenue</th></tr>
      ${dailyData}
    </table>
    <div class="footer">
      <p><strong>Monthly Items:</strong> ${totalItems}</p>
      <p><strong>Monthly Orders:</strong> ${totalOrders}</p>
      <p><strong>Monthly Revenue:</strong> ₹${totalRevenue.toFixed(2)}</p>
    </div>
  `;

  const fileName = `Monthly_Sales_${monthName.replace(/\s/g, '_')}.pdf`;
  const htmlContent = generateHTMLWrapper('Monthly Sales Report', monthName, body, restaurantName);
  const { uri } = await printToFileAsync({ html: htmlContent });
  const newPath = FileSystem.documentDirectory + fileName;
  await FileSystem.moveAsync({ from: uri, to: newPath });
  return newPath;
};

// ✅ Weekly, Yearly, AllTime and Single-Day PDF Generators
export const generateWeeklySalesPDF = async (sales: Sale[], weekLabel: string, restaurantName: string) => {
  const groupedByDay = new Map<string, { items: number; orders: number; revenue: number }>();

  for (const sale of sales) {
    const date = new Date(sale.timestamp);
    const key = date.toLocaleDateString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
    const day = date.toLocaleDateString('en-GB', { weekday: 'short' });
    const mapKey = `${key} (${day})`;

    if (!groupedByDay.has(mapKey)) {
      groupedByDay.set(mapKey, { items: sale.totalItems, orders: 1, revenue: sale.totalPrice });
    } else {
      const prev = groupedByDay.get(mapKey)!;
      groupedByDay.set(mapKey, {
        items: prev.items + sale.totalItems,
        orders: prev.orders + 1,
        revenue: prev.revenue + sale.totalPrice,
      });
    }
  }

  const rowsHTML = Array.from(groupedByDay.entries()).map(([date, stats], idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>${date}</td>
      <td>${stats.items}</td>
      <td>${stats.orders}</td>
      <td>₹${stats.revenue.toFixed(2)}</td>
    </tr>`).join('');

  const totals = Array.from(groupedByDay.values()).reduce((acc, val) => {
    acc.items += val.items;
    acc.orders += val.orders;
    acc.revenue += val.revenue;
    return acc;
  }, { items: 0, orders: 0, revenue: 0 });

  const body = `
    <table>
      <tr><th>#</th><th>Date & Day</th><th>Items</th><th>Orders</th><th>Revenue</th></tr>
      ${rowsHTML}
    </table>
    <div class="footer">
      <p><strong>Weekly Items:</strong> ${totals.items}</p>
      <p><strong>Weekly Orders:</strong> ${totals.orders}</p>
      <p><strong>Weekly Revenue:</strong> ₹${totals.revenue.toFixed(2)}</p>
    </div>
  `;

  const htmlContent = generateHTMLWrapper('Weekly Sales Report', weekLabel, body, restaurantName);
  const fileName = `Weekly_Sales_${weekLabel.replace(/\s/g, '_')}.pdf`;
  const { uri } = await printToFileAsync({ html: htmlContent });
  const newPath = FileSystem.documentDirectory + fileName;
  await FileSystem.moveAsync({ from: uri, to: newPath });
  return newPath;
};

export const generateYearlySalesPDF = async (summaries: MonthlySummary[], year: string, restaurantName: string) => {
  const rowsHTML = summaries.map((s, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>${s.month}</td>
      <td>${s.totalItems}</td>
      <td>${s.totalOrders}</td>
      <td>₹${s.totalRevenue.toFixed(2)}</td>
    </tr>`).join('');

  const totalItems = summaries.reduce((sum, m) => sum + m.totalItems, 0);
  const totalOrders = summaries.reduce((sum, m) => sum + m.totalOrders, 0);
  const totalRevenue = summaries.reduce((sum, m) => sum + m.totalRevenue, 0);

  const body = `
    <table>
      <tr><th>#</th><th>Month</th><th>Items</th><th>Orders</th><th>Revenue</th></tr>
      ${rowsHTML}
    </table>
    <div class="footer">
      <p><strong>Total Items:</strong> ${totalItems}</p>
      <p><strong>Total Orders:</strong> ${totalOrders}</p>
      <p><strong>Total Revenue:</strong> ₹${totalRevenue.toFixed(2)}</p>
    </div>
  `;

  const htmlContent = generateHTMLWrapper('Yearly Sales Report', year, body, restaurantName);
  const fileName = `Yearly_Sales_${year}.pdf`;
  const { uri } = await printToFileAsync({ html: htmlContent });
  const newPath = FileSystem.documentDirectory + fileName;
  await FileSystem.moveAsync({ from: uri, to: newPath });
  return newPath;
};

export const generateAllTimeSalesPDF = async (
  yearlySummaries: { year: number; totalItems: number; totalOrders: number; totalRevenue: number }[],
  restaurantName: string
) => {
  const rowsHTML = yearlySummaries.map((row, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>${row.year}</td>
      <td>${row.totalItems}</td>
      <td>${row.totalOrders}</td>
      <td>₹${row.totalRevenue.toFixed(2)}</td>
    </tr>`).join('');

  const totals = yearlySummaries.reduce((acc, y) => {
    acc.items += y.totalItems;
    acc.orders += y.totalOrders;
    acc.revenue += y.totalRevenue;
    return acc;
  }, { items: 0, orders: 0, revenue: 0 });

  const body = `
    <table>
      <tr><th>#</th><th>Year</th><th>Items</th><th>Orders</th><th>Revenue</th></tr>
      ${rowsHTML}
    </table>
    <div class="footer">
      <p><strong>Total Items:</strong> ${totals.items}</p>
      <p><strong>Total Orders:</strong> ${totals.orders}</p>
      <p><strong>Total Revenue:</strong> ₹${totals.revenue.toFixed(2)}</p>
    </div>
  `;

  const htmlContent = generateHTMLWrapper('All-Time Sales Report', '', body, restaurantName);
  const fileName = `AllTime_Sales_Report.pdf`;
  const { uri } = await printToFileAsync({ html: htmlContent });
  const newPath = FileSystem.documentDirectory + fileName;
  await FileSystem.moveAsync({ from: uri, to: newPath });
  return newPath;
};

export const generateSingleDaySalesPDF = async (sales: Sale[], label: string, restaurantName: string): Promise<string> => {
  const totalItems = sales.reduce((sum, s) => sum + s.totalItems, 0);
  const totalOrders = sales.length;
  const totalRevenue = sales.reduce((sum, s) => sum + s.totalPrice, 0);

  const rowsHTML = sales.map((sale, idx) => {
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
  }).join('');

  const body = `
    <table>
      <tr><th>#</th><th>Table</th><th>Time</th><th>Items</th><th>Item Names</th><th>Total Price</th></tr>
      ${rowsHTML}
    </table>
    <div class="footer">
      <p><strong>Total Orders:</strong> ${totalOrders}</p>
      <p><strong>Total Items:</strong> ${totalItems}</p>
      <p><strong>Total Revenue:</strong> ₹${totalRevenue.toFixed(2)}</p>
    </div>
  `;

  const htmlContent = generateHTMLWrapper('Daily Sales Report', label, body, restaurantName);
  const fileName = `Sales_Report_${label.replace(/\s+/g, '_')}.pdf`;
  const { uri } = await printToFileAsync({ html: htmlContent });
  const newPath = FileSystem.documentDirectory + fileName;
  await FileSystem.moveAsync({ from: uri, to: newPath });
  return newPath;
};

