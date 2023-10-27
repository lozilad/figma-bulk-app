figma.showUI(__html__);
figma.ui.resize(500, 375);

const SUFFIX = '_1';

figma.ui.onmessage = message => {
  if (message.type === 'cancel') {
    figma.closePlugin();
  }
  
  if (message.type === 'create-rectangles') {
    const nodes: SceneNode[] = [];
    for (let i = 0; i < message.count; i++) {
      const rect = figma.createRectangle();
      rect.x = i * 150;
      rect.fills = [{type: 'SOLID', color: {r: 1, g: 0.5, b: 0}}];
      figma.currentPage.appendChild(rect);
      nodes.push(rect);
    }
    figma.currentPage.selection = nodes;
    figma.viewport.scrollAndZoomIntoView(nodes);
  }

  if (message.type === 'collect_variables') {
    const localCollections = figma.variables.getLocalVariableCollections();
    console.log(localCollections);
  }


  if (message.type === 'rename') {
    bulkRename(message.suffix);
  }

  if (message.type === 'redo') {
    bulkRedo(message.suffix);
  }

  
};

function bulkRename(suffix = SUFFIX) {

  const selection = figma.currentPage.selection;
  selection.forEach((item) => {
    // @ts-ignore
    item.children.forEach(async child => {
      

      const final_name = child.name + suffix;
      const final_text = child.characters + suffix;
      child.name = final_name;
      if (child.type === 'TEXT') {
        await Promise.all(
          child.getRangeAllFontNames(0, child.characters.length)
            .map(figma.loadFontAsync)
        );

        child.autoRename = true;
        child.characters = final_text;
      }
    });
  });
  return null;
}

function bulkRedo(suffix = SUFFIX) {
  const selection = figma.currentPage.selection;
  selection.forEach((item) => {
    const len = suffix.length;
    // @ts-ignore
    item.children.forEach(async child =>  {
      const final_name = child.name.slice(0, child.name.length - len);
      child.name = final_name;
      if (child.type === 'TEXT') {
        await Promise.all(
          child.getRangeAllFontNames(0, child.characters.length)
            .map(figma.loadFontAsync)
        );

        child.autoRename = true;
        child.characters = final_name;
      }
    });
  });
  return null;
}

figma.on('selectionchange', () => {
  const selection = figma.currentPage.selection;
  const _logs = selection.map((item) => {
    // @ts-ignore
    return item.children.map(_item => `[${_item.type}]: ${_item.name}`);
  });
  console.log('[LOGS]', _logs);
  figma.ui.postMessage({logs: _logs.length > 0 ? _logs.pop() : []}, {origin: '*'});
})


