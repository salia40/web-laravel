const $ = (s) => document.querySelector(s);

const rupiah = n => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0
}).format(Number(n) || 0);

const contoh = {
  categories: ['Elektronik', 'Aksesori', 'Alat Tulis'],
  suppliers: ['PT Sumber Makmur', 'CV Berkah Jaya'],
  products: [
    {id:1, sku:'ELK-001', name:'Headphone Wireless', category:'Elektronik', price:275000, stock:24, min:8},
    {id:2, sku:'AKS-002', name:'Botol Minum Pastel', category:'Aksesori', price:65000, stock:6, min:10},
    {id:3, sku:'ATK-003', name:'Notebook A5', category:'Alat Tulis', price:28000, stock:48, min:12},
    {id:4, sku:'ELK-004', name:'Keyboard Mechanical', category:'Elektronik', price:425000, stock:4, min:6},
    {id:5, sku:'AKS-005', name:'Tote Bag Canvas', category:'Aksesori', price:55000, stock:19, min:7}
  ],
  sales: [
    {id:1001, customer:'Nadia Putri', product:'Headphone Wireless', qty:1, total:275000, date:new Date().toISOString().slice(0,10)},
    {id:1002, customer:'Rizky Pratama', product:'Notebook A5', qty:3, total:84000, date:new Date().toISOString().slice(0,10)}
  ],
  purchases: []
};

let db;
try {
  db = JSON.parse(localStorage.getItem('pinkstock-data')) || structuredClone(contoh);
} catch {
  db = contoh;
}

function save() {
  localStorage.setItem('pinkstock-data', JSON.stringify(db));
}

if (!localStorage.getItem('pinkstock-data')) save();

let page = 'dashboard';
let editingId = null;
let formMode = 'product';

const titles = {
  dashboard:'Dashboard',
  products:'Produk',
  categories:'Kategori',
  suppliers:'Supplier',
  purchases:'Barang Masuk',
  sales:'Penjualan',
  reports:'Laporan'
};

function lowStock() {
  return db.products.filter(p => Number(p.stock) <= Number(p.min));
}

function heading(title, description, button='') {
  return `<div class="welcome">
    <div><h1>${title}</h1><p>${description}</p></div>${button}
  </div>`;
}

function stat(label, value, emoji) {
  return `<div class="card">
    <div class="label">${emoji} ${label}</div>
    <div class="number">${value}</div>
    <div class="muted">Ringkasan inventaris PinkStock</div>
  </div>`;
}

function table(headers, rows) {
  return `<div class="panel table-wrap"><table>
    <thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${rows || `<tr><td class="empty" colspan="${headers.length}">Belum ada data.</td></tr>`}</tbody>
  </table></div>`;
}

function dashboard() {
  const stock = db.products.reduce((sum,p)=>sum+Number(p.stock),0);
  const revenue = db.sales.reduce((sum,s)=>sum+Number(s.total),0);

  const recent = [...db.sales].reverse().slice(0,5).map(s=>`
    <tr>
      <td>#PS-${s.id}</td><td>${s.customer}</td>
      <td>${s.product}</td><td>${s.date}</td>
      <td><b>${rupiah(s.total)}</b></td>
    </tr>`).join('');

  const alerts = lowStock().map(p=>`
    <div class="stock-row">
      <div><b>${p.name}</b><br><span class="muted">${p.sku}</span></div>
      <div style="text-align:right;color:#cb496c">
        <b>${p.stock} unit</b><br><span class="muted">Min. ${p.min}</span>
      </div>
    </div>`).join('');

  return heading('Dashboard','Selamat datang di PinkStock! Kelola inventaris dengan mudah.',
      `<button class="btn" onclick="openForm('sale')">＋ Transaksi Penjualan</button>`)
    + `<div class="stats">
      ${stat('Total Produk',db.products.length,'📦')}
      ${stat('Total Stok',stock+' unit','▣')}
      ${stat('Total Penjualan',rupiah(revenue),'💗')}
      ${stat('Stok Menipis',lowStock().length,'⚠️')}
    </div>
    <div class="grid">
      <div class="panel">
        <h3>📊 Ringkasan Inventaris</h3>
        <p class="muted">Jumlah produk berdasarkan stok saat ini.</p>
        ${db.products.map(p=>`<div class="stock-row">
          <span>${p.name}</span><b>${p.stock} unit</b>
        </div>`).join('')}
      </div>
      <div class="panel">
        <h3>⚠️ Perlu Restock</h3>
        ${alerts || '<p class="empty">Semua stok aman ✨</p>'}
      </div>
    </div>
    <div class="panel">
      <h3>Transaksi Penjualan Terbaru</h3>
      ${table(['ID','Pelanggan','Produk','Tanggal','Total'],recent)}
    </div>`;
}

function productRows(list=db.products) {
  return list.map(p=>`<tr>
    <td><b>${p.name}</b><br><span class="muted">${p.sku}</span></td>
    <td>${p.category}</td>
    <td>${rupiah(p.price)}</td>
    <td>${p.stock}</td>
    <td>${p.min}</td>
    <td><span class="status ${p.stock<=p.min?'low':''}">
      ${p.stock<=p.min?'Stok menipis':'Tersedia'}
    </span></td>
    <td><div class="actions">
      <button onclick="editProduct(${p.id})">Edit</button>
      <button onclick="deleteProduct(${p.id})">Hapus</button>
    </div></td>
  </tr>`).join('');
}

function products() {
  return heading('Produk','Kelola katalog, harga, dan stok produk.',
    '<button class="btn" onclick="openForm(\\'product\\')">＋ Tambah Produk</button>')
    + `<div class="toolbar">
      <input id="search" placeholder="Cari nama atau SKU produk..." oninput="searchProducts(this.value)">
      <button class="btn secondary" onclick="exportCSV()">Export CSV</button>
    </div>
    <div class="panel table-wrap"><table>
      <thead><tr><th>Produk</th><th>Kategori</th><th>Harga</th><th>Stok</th><th>Min.</th><th>Status</th><th>Aksi</th></tr></thead>
      <tbody id="productRows">${productRows()}</tbody>
    </table></div>`;
}

function searchProducts(query) {
  const q = query.toLowerCase();
  const rows = db.products.filter(p=>
    (p.name+' '+p.sku+' '+p.category).toLowerCase().includes(q)
  );
  $('#productRows').innerHTML = productRows(rows) ||
    '<tr><td colspan="7" class="empty">Produk tidak ditemukan.</td></tr>';
}

function categories() {
  return heading('Kategori','Daftar kategori produk.')
    + table(['Nama Kategori','Jumlah Produk'],db.categories.map(c=>`
      <tr><td>${c}</td><td>${db.products.filter(p=>p.category===c).length}</td></tr>`
    ).join(''));
}

function suppliers() {
  return heading('Supplier','Daftar pemasok barang.')
    + table(['Nama Supplier'],db.suppliers.map(s=>`<tr><td>${s}</td></tr>`).join(''));
}

function transactions(type) {
  const isSale = type === 'sales';
  const data = isSale ? db.sales : db.purchases;
  const title = isSale ? 'Penjualan' : 'Barang Masuk';
  return heading(title, isSale?'Catat transaksi penjualan.':'Catat barang masuk dari supplier.',
    `<button class="btn" onclick="openForm('${isSale?'sale':'purchase'}')">＋ Tambah Transaksi</button>`)
    + table(['ID','Pelanggan / Supplier','Produk','Jumlah','Total','Tanggal'],
      [...data].reverse().map(t=>`<tr>
        <td>#${t.id}</td><td>${t.customer||t.supplier||'-'}</td>
        <td>${t.product}</td><td>${t.qty}</td>
        <td>${rupiah(t.total)}</td><td>${t.date}</td>
      </tr>`).join(''));
}

function reports() {
  const total = db.sales.reduce((sum,s)=>sum+s.total,0);
  return heading('Laporan','Ringkasan transaksi dan inventaris.')
    + `<div class="stats">
      ${stat('Total Penjualan',rupiah(total),'💗')}
      ${stat('Transaksi Penjualan',db.sales.length,'🧾')}
      ${stat('Jenis Produk',db.products.length,'📦')}
      ${stat('Stok Menipis',lowStock().length,'⚠️')}
    </div>
    <button class="btn" onclick="exportCSV()">Export daftar produk CSV</button>`;
}

function render() {
  $('#pageTitle').textContent = titles[page];
  document.querySelectorAll('.nav').forEach(b=>
    b.classList.toggle('active',b.dataset.page===page)
  );

  const pages = {
    dashboard, products, categories, suppliers, reports,
    sales:()=>transactions('sales'),
    purchases:()=>transactions('purchases')
  };
  $('#content').innerHTML = pages[page]();
}

document.querySelectorAll('.nav').forEach(button=>{
  button.addEventListener('click',()=>{
    page = button.dataset.page;
    render();
  });
});

function openForm(mode, id=null) {
  formMode = mode;
  editingId = id;
  const p = db.products.find(x=>x.id===id) || {};
  $('#formTitle').textContent = id ? 'Edit Produk' :
    ({product:'Tambah Produk',sale:'Transaksi Penjualan',purchase:'Barang Masuk'}[mode] || 'Tambah Data');

  let fields = '';

  if (mode === 'product') {
    fields = `
      <label>SKU<input name="sku" required value="${p.sku||''}" placeholder="Contoh: ELK-007"></label>
      <label>Nama Produk<input name="name" required value="${p.name||''}" placeholder="Nama produk"></label>
      <label>Kategori<select name="category" required>
        ${db.categories.map(c=>`<option ${p.category===c?'selected':''}>${c}</option>`).join('')}
      </select></label>
      <label>Harga (Rp)<input name="price" type="number" min="0" required value="${p.price||''}"></label>
      <label>Stok<input name="stock" type="number" min="0" required value="${p.stock??''}"></label>
      <label>Stok Minimum<input name="min" type="number" min="0" required value="${p.min??''}"></label>`;
  } else {
    fields = `
      <label>${mode==='sale'?'Nama Pelanggan':'Nama Supplier'}
        <input name="person" required placeholder="Masukkan nama">
      </label>
      <label>Produk<select name="productId" required>
        ${db.products.map(p=>`<option value="${p.id}">${p.name} — stok ${p.stock}</option>`).join('')}
      </select></label>
      <label>Jumlah<input name="qty" type="number" min="1" value="1" required></label>`;
  }

  $('#dataForm').innerHTML = fields +
    '<button class="btn" type="submit">Simpan Data</button>';
  $('#modal').classList.add('show');
}

window.openForm = openForm;

window.editProduct = id => openForm('product',id);

window.deleteProduct = id => {
  if (!confirm('Hapus produk ini?')) return;
  if (db.sales.some(s=>s.productId===id) || db.purchases.some(s=>s.productId===id)) {
    alert('Produk mempunyai riwayat transaksi.');
    return;
  }
  db.products = db.products.filter(p=>p.id!==id);
  save(); render();
};

window.searchProducts = searchProducts;

$('#closeModal').addEventListener('click',()=>$('#modal').classList.remove('show'));

$('#modal').addEventListener('click',e=>{
  if (e.target.id==='modal') $('#modal').classList.remove('show');
});

$('#dataForm').addEventListener('submit',e=>{
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());

  if (formMode === 'product') {
    if (db.products.some(p=>p.sku.toLowerCase()===data.sku.toLowerCase() && p.id!==editingId)) {
      alert('SKU sudah digunakan.');
      return;
    }

    const product = {
      id:editingId || Date.now(),
      sku:data.sku,
      name:data.name,
      category:data.category,
      price:Number(data.price),
      stock:Number(data.stock),
      min:Number(data.min)
    };

    if (editingId) {
      db.products = db.products.map(p=>p.id===editingId?product:p);
    } else {
      db.products.push(product);
    }
  } else {
    const p = db.products.find(p=>p.id===Number(data.productId));
    const qty = Number(data.qty);

    if (!p || qty<1) return;

    if (formMode==='sale' && p.stock<qty) {
      alert('Stok tidak mencukupi!');
      return;
    }

    if (formMode==='sale') p.stock -= qty;
    else p.stock += qty;

    const transaction = {
      id:Date.now(),
      customer:formMode==='sale'?data.person:'',
      supplier:formMode==='purchase'?data.person:'',
      product:p.name,
      productId:p.id,
      qty,
      total:p.price*qty,
      date:new Date().toISOString().slice(0,10)
    };

    if (formMode==='sale') db.sales.push(transaction);
    else db.purchases.push(transaction);
  }

  save();
  $('#modal').classList.remove('show');
  render();
  alert('Data berhasil disimpan!');
});

window.exportCSV = () => {
  const rows = [
    ['SKU','Nama Produk','Kategori','Harga','Stok','Stok Minimum'],
    ...db.products.map(p=>[p.sku,p.name,p.category,p.price,p.stock,p.min])
  ];
  const csv = rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');
  const blob = new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'pinkstock-laporan.csv';
  a.click();
  URL.revokeObjectURL(a.href);
};

render();
