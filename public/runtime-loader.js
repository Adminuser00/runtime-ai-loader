// Runtime AI Loader - Auto Plugin Connector
console.log("Runtime Loader LIVE - S-Clouds");
const PLUGIN_PATH = "/plugins/";

export async function loadPlugins() {
  try {
    const manifest = await fetch(PLUGIN_PATH + "manifest.json").then(r=>r.json()).catch(()=>({plugins:["cat","fetch","execution","processing","development"]}));
    for(let name of manifest.plugins){
      try{
        const mod = await import(`${PLUGIN_PATH}${name}.js?v=${Date.now()}`);
        if(mod.init) await mod.init();
        console.log(`✅ Plugin loaded: ${name}`);
        addToDashboard(name, mod);
      }catch(e){ console.warn(`Plugin ${name} missing, creating...`, e); await createPlugin(name); }
    }
  }catch(e){ console.error("Loader error", e); }
}

function addToDashboard(name, mod){
  const grid = document.getElementById('pluginGrid');
  if(!grid) return;
  const div = document.createElement('div');
  div.className='card';
  div.innerHTML=`<b>${name.toUpperCase()} Layer</b><br><small style="color:#0f0">● Active - ${mod.status||'ready'}</small><br><button onclick="window.runPlugin('${name}')" style="margin-top:6px;padding:6px 10px;background:#222;border:1px solid #333;color:#fff;border-radius:6px">Run</button>`;
  grid.appendChild(div);
}

async function createPlugin(name){
  // AI se auto banwao
  const res = await fetch('/api/plugin', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({pluginName: name})
  });
  const data = await res.json();
  console.log(`Created ${name}:`, data);
}

window.runPlugin = (name) => {
  const event = new CustomEvent('run-plugin', {detail:{name}});
  window.dispatchEvent(event);
};

// auto load on start
loadPlugins();
