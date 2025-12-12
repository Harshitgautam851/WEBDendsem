/* script.js
   - product data array
   - render functions for products / preview / product detail / cart
   - simple auth (signup/login) using localStorage + SHA-256 hashing (demo)
   - cart operations (add/remove/update) stored in localStorage
*/

/* -----------------------
   Simple product dataset
------------------------*/
const PRODUCTS = [
  { id: "p1", name: "Cotton T-Shirt", price: 15, category: "clothes", desc: "Comfortable cotton tee.", img: "https://via.placeholder.com/400x300?text=T-Shirt" },
  { id: "p2", name: "Bluetooth Headphones", price: 40, category: "electronics", desc: "Wireless audio device.", img: "https://via.placeholder.com/400x300?text=Headphones" },
  { id: "p3", name: "Wooden Bowl", price: 25, category: "handmade", desc: "Handmade wooden bowl.", img: "https://via.placeholder.com/400x300?text=Wooden+Bowl" },
  { id: "p4", name: "Denim Jacket", price: 45, category: "clothes", desc: "Stylish denim jacket.", img: "https://via.placeholder.com/400x300?text=Denim+Jacket" },
  { id: "p5", name: "Smart Watch", price: 90, category: "electronics", desc: "Track your activity.", img: "https://via.placeholder.com/400x300?text=Smart+Watch" },
  { id: "p6", name: "Handmade Vase", price: 30, category: "handmade", desc: "Decorative clay vase.", img: "https://via.placeholder.com/400x300?text=Handmade+Vase" }
];

/* -----------------------
   STORAGE + AUTH Helpers
------------------------*/
function getUsers(){ try{ return JSON.parse(localStorage.getItem('users')||'{}'); }catch(e){return{}} }
function saveUsers(u){ localStorage.setItem('users', JSON.stringify(u)); }
function getCurrentUser(){ return localStorage.getItem('currentUser'); }
function setCurrentUser(email){ localStorage.setItem('currentUser', email); }
function clearCurrentUser(){ localStorage.removeItem('currentUser'); }
function isAuthenticated(){ return !!getCurrentUser(); }

/* SHA-256 hashing helper */
async function hashPassword(pw){
  const enc = new TextEncoder();
  const data = enc.encode(pw);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

/* signup/login functions */
async function signup(email, password){
  email = (email||'').trim().toLowerCase();
  if(!email || !password) throw new Error('Email and  password are required');
  const users = getUsers();
  if(users[email]) throw new Error('This email is already registered.');
  const h = await hashPassword(password);
  users[email]=h; saveUsers(users);
  setCurrentUser(email);
  return true;
}
async function login(email, password){
  email = (email||'').trim().toLowerCase();
  if(!email || !password) throw new Error('Email और password आवश्यक हैं।');
  const users = getUsers();
  const stored = users[email];
  if(!stored) throw new Error('This email is already registered।');
  const h = await hashPassword(password);
  if(h!==stored) throw new Error('wrong password।');
  setCurrentUser(email);
  return true;
}
function logout(){ clearCurrentUser(); window.location.href='index.html'; }

/* -----------------------
   CART Helpers
------------------------*/
function getCart(){ try{ return JSON.parse(localStorage.getItem('cart')||'[]'); }catch(e){return[]} }
function saveCart(c){ localStorage.setItem('cart', JSON.stringify(c)); }
function addToCart(name, price, id){
  if(!isAuthenticated()){
    alert('कृपया पहले लॉगिन करें।');
    localStorage.setItem('postAction', JSON.stringify({action:'addToCart', id}));
    window.location.href='login.html';
    return;
  }
  const cart = getCart();
  cart.push({ id, name, price, qty:1 });
  saveCart(cart);
  alert(name + ' added to cart.');
  // optionally update UI if on products or cart page
  if(typeof renderCart === 'function') renderCart();
}
function removeFromCart(index){
  const cart = getCart(); cart.splice(index,1); saveCart(cart); if(typeof renderCart==='function') renderCart();
}
function updateQty(index, qty){
  const cart = getCart(); if(!cart[index]) return;
  cart[index].qty = Math.max(1, Number(qty)||1); saveCart(cart); if(typeof renderCart==='function') renderCart();
}

/* -----------------------
   RENDER: preview / products
------------------------*/
function renderPreview(){
  const preview = document.getElementById('previewGrid');
  if(!preview) return;
  preview.innerHTML = '';
  const slice = PRODUCTS.slice(0,4);
  slice.forEach(p=>{
    const el = document.createElement('div'); el.className='card';
    el.innerHTML = `<img src="${p.img}" alt="${p.name}"><h4><a href="product.html?id=${p.id}">${p.name}</a></h4>
      <p class="muted">${p.desc}</p><div class="price">$${p.price}</div>
      <div class="actions"><button onclick="addToCart('${p.name}',${p.price},'${p.id}')">Add</button>
      <a class="btn" href="product.html?id=${p.id}">View</a></div>`;
    preview.appendChild(el);
  });
}

/* renderProducts(filter, category) */
function renderProducts(filter='', category=''){
  const cont = document.getElementById('productsList');
  if(!cont) return;
  cont.innerHTML = '';
  const q = (filter||'').trim().toLowerCase();
  PRODUCTS.filter(p=>{
    if(category && p.category!==category) return false;
    if(q && !(p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q))) return false;
    return true;
  }).forEach(p=>{
    const el = document.createElement('div'); el.className='card';
    el.innerHTML = `<img src="${p.img}" alt="${p.name}"><h4><a href="product.html?id=${p.id}">${p.name}</a></h4>
      <p class="muted">${p.desc}</p><div class="price">$${p.price}</div>
      <div class="actions"><button onclick="addToCart('${p.name}',${p.price},'${p.id}')">Add to Cart</button>
      <a class="btn" href="product.html?id=${p.id}">Details</a></div>`;
    cont.appendChild(el);
  });
}

/* -----------------------
   RENDER: product detail
------------------------*/
function renderProductDetail(){
  const root = document.getElementById('productDetail');
  if(!root) return;
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const p = PRODUCTS.find(x=>x.id===id) || PRODUCTS[0];
  root.innerHTML = `
    <div class="product-detail-card">
      <div style="display:flex;gap:18px;flex-wrap:wrap">
        <img src="${p.img}" alt="${p.name}" style="width:320px;border-radius:8px">
        <div>
          <h2>${p.name}</h2>
          <p class="muted">${p.desc}</p>
          <div class="price" style="font-size:20px;margin-top:8px">$${p.price}</div>
          <div style="margin-top:12px">
            <button onclick="addToCart('${p.name}',${p.price},'${p.id}')">Add to Cart</button>
            <a class="btn" href="products.html">Back to Products</a>
          </div>
        </div>
      </div>
    </div>`;
  // related: show 3 other products
  const rel = document.getElementById('relatedGrid');
  if(rel){
    rel.innerHTML=''; PRODUCTS.filter(x=>x.id!==p.id).slice(0,3).forEach(r=>{
      const c=document.createElement('div'); c.className='card';
      c.innerHTML=`<img src="${r.img}"><h4><a href="product.html?id=${r.id}">${r.name}</a></h4><div class="price">$${r.price}</div>`;
      rel.appendChild(c);
    });
  }
}

/* -----------------------
   RENDER: cart page
------------------------*/
function renderCart(){
  const list = document.getElementById('cartItems');
  const summary = document.getElementById('cartSummary');
  if(!list || !summary) return;
  const cart = getCart();
  list.innerHTML=''; summary.innerHTML='';
  if(cart.length===0){
    list.innerHTML='<p>Your cart is empty.</p>';
    return;
  }
  cart.forEach((item, idx)=>{
    const row = document.createElement('div'); row.className='cart-row';
    row.innerHTML = `<img src="${(PRODUCTS.find(p=>p.id===item.id)||{}).img||'https://via.placeholder.com/80'}" alt="${item.name}">
      <div style="flex:1">
        <div style="font-weight:700">${item.name}</div>
        <div class="muted">Price: $${item.price}</div>
        <div style="margin-top:8px">
          <label>Qty</label>
          <input type="number" min="1" value="${item.qty}" onchange="updateQty(${idx}, this.value)" style="width:60px;margin-left:8px">
          <button onclick="removeFromCart(${idx})" style="margin-left:8px">Remove</button>
        </div>
      </div>`;
    list.appendChild(row);
  });
  const total = cart.reduce((s,i)=>s + i.price * (i.qty||1),0);
  summary.innerHTML = `<div style="font-weight:800;font-size:18px">Total: $${total.toFixed(2)}</div>
    <div style="margin-top:10px">
      <a class="btn" href="checkout.html">Proceed to Checkout</a>
      <a class="btn alt" href="products.html" style="margin-left:8px">Continue Shopping</a>
    </div>`;
}

/* -----------------------
   CHECKOUT handler
------------------------*/
function handleCheckout(){
  const form = document.getElementById('checkoutForm');
  const msg = document.getElementById('checkoutMsg');
  if(!form) return;
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    if(!isAuthenticated()){
      alert('कृपया पहले लॉगिन करें।');
      window.location.href='login.html';
      return;
    }
    // basic validation done by HTML attributes - here we clear cart and show message
    localStorage.removeItem('cart');
    msg.style.color='green';
    msg.textContent='Order placed (demo). Redirecting to home...';
    setTimeout(()=> window.location.href='index.html',900);
  });
}

/* -----------------------
   AUTH UI + form wiring
------------------------*/
function updateAuthUI(){
  const out = document.getElementById('userInfo');
  const user = getCurrentUser();
  if(!out) return;
  if(user){
    out.innerHTML = `Signed in as <strong style="color:#fff">${user}</strong> <button onclick="logout()" style="margin-left:8px;padding:6px;border-radius:6px;background:#fff;color:#005bb5;border:none;cursor:pointer">Logout</button>`;
  } else {
    out.innerHTML = `<a style="color:#fff;text-decoration:underline" href="login.html">Login / Signup</a>`;
  }
}

/* login/signup forms on login.html */
document.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();

  // if login form exists
  const lf = document.getElementById('loginForm');
  if(lf){
    lf.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const email = document.getElementById('email').value;
      const pass = document.getElementById('password').value;
      const err = document.getElementById('error');
      if(err) err.textContent='';
      try{
        await login(email, pass);
        if(err) { err.style.color='green'; err.textContent='Login successful'; }
        // after login redirect to saved page or homepage
        setTimeout(()=> window.location.href = (localStorage.getItem('postLoginRedirect')||'index.html'), 600);
      }catch(ex){
        if(err) { err.style.color='red'; err.textContent = ex.message || 'Login failed'; }
      }
    });
  }

  // signup form
  const sf = document.getElementById('signupForm');
  if(sf){
    sf.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const email = document.getElementById('signupEmail').value;
      const pass = document.getElementById('signupPassword').value;
      const out = document.getElementById('signupError');
      if(out) out.textContent='';
      try{
        await signup(email, pass);
        if(out){ out.style.color='green'; out.textContent='Signup done'; }
        setTimeout(()=> window.location.href='index.html',700);
      }catch(ex){
        if(out){ out.style.color='red'; out.textContent = ex.message || 'Signup failed'; }
      }
    });
  }

  // small handlers called from HTML pages
  if(typeof renderPreview === 'function') renderPreview();
  if(typeof renderProducts === 'function' && document.getElementById('productsList')) renderProducts();
  if(typeof renderProductDetail === 'function' && document.getElementById('productDetail')) renderProductDetail();
  if(typeof renderCart === 'function' && document.getElementById('cartItems')) renderCart();
  if(typeof handleCheckout === 'function' && document.getElementById('checkoutForm')) handleCheckout();
});
