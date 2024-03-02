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

function getSections(text) {
  let lines = text.split('\n');
  let sections = [];
  var sectionLine = [];
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (line.startsWith('###')) {
      sections.push(sectionLine.join('\n'));
      sectionLine = [];
    } else {
      sectionLine.push(line);
    }
  }
  if (sectionLine.length > 0) sections.push(sectionLine.join('\n'));
  return sections;
}

function splitTextIntoParts(text, linesPerPart) {
  let lines = text.split('\n');
  let parts = [];
  for (let i = 0; i < lines.length; i += linesPerPart) {
    let part = lines.slice(i, i + linesPerPart);
    parts.push(part.join('\n'));
  }
  return parts;
}

let oldText;
async function ask() {
  await ensureNoteBook();
  let input = await ensureInput();
  let button = await ensureButton();
  oldText = input.value;
  let preText;
  let longText;
  let question;
  let sections = getSections(oldText);
  if (sections.length == 1) {
    question = sections[0];
  } else if (sections.length == 2) {
    longText = sections[0];
    question = sections[1];
  } else if (sections.length == 3) {
    preText = sections[0];
    longText = sections[1];
    question = sections[2];
  }

  let parts = longText ? splitTextIntoParts(longText, 300) : [question];
  console.log('split to parts = ' + parts.length);
  let outputs = [];

  for (let part of parts) {
    input.value = preText ?? '' + '\n' + part + '\n' + question ?? '';
    input.dispatchEvent(new Event('change', { bubbles: true }));

    button.click();

    let loading = await ensureLoading();
    await ensureLoadingCompleted(loading);
    let codeEle = querySelectorShadow(document.body, 'cib-code-block[clipboard-data]');
    let result = codeEle.getAttribute('clipboard-data');
    outputs.push(result);
  }

  let codeEle = querySelectorShadow(document.body, 'cib-code-block[clipboard-data]');
  codeEle.setAttribute('clipboard-data', outputs.join('\n'));
  input.value = oldText;
  return outputs;
}

let result = await ask();
console.log(result.join('\n'));
await navigator.clipboard.writeText(result.join('\n'));
alert('done');