function querySelectorShadow(node, selector) {
  if (node.shadowRoot != null) {
    let match = node.shadowRoot.querySelector(selector);
    if (match != null) return match;
  }

  let children = node.shadowRoot ? node.shadowRoot.childNodes : node.childNodes;
  for (let i = 0; i < children.length; i++) {
    let match = querySelectorShadow(children[i], selector);
    if (match != null) return match;
  }

  return null;
}

function ensureElement(selector) {
  return new Promise((resolve, reject) => {
    let interval = setInterval(() => {
      let ele = querySelectorShadow(document.body, selector);
      if (ele && !ele.disabled) {
        clearInterval(interval);
        resolve(ele);
      }
    }, 300);
  });
}

function ensureNoteBook() {
  return new Promise((resolve, reject) => {
    let interval = setInterval(() => {
      let ele = document.getElementById('b-scopeListItem-notebook');
      if (ele) {
        clearInterval(interval);
        ele.click();
        resolve(ele);
      }
    }, 300);
  });
}

function ensureInput() {
  return ensureElement('#searchbox');
}

function ensureButton() {
  return ensureElement('button[is="cib-button"]');
}

function ensureLoading() {
  return ensureElement('#stop-responding-button');
}

function ensureLoadingCompleted(loading) {
  return new Promise((resolve, reject) => {
    let interval = setInterval(() => {
      if (loading.disabled) {
        clearInterval(interval);
        resolve();
      }
    }, 300);
  });
}

function ensureCodeBlock() {
  return ensureElement('cib-code-block[clipboard-data]');
}

async function ask(question) {
  await ensureNoteBook();
  var intput = await ensureInput();
  intput.value = question;
  intput.dispatchEvent(new Event('change', { bubbles: true }));

  var button = await ensureButton();
  button.click();
  let loading = await ensureLoading();
  await ensureLoadingCompleted(loading);
  var codeEle = querySelectorShadow(document.body, 'cib-code-block[clipboard-data]');
  console.log(codeEle);
}

await ask('get document by id?\n please answer short code block only');
