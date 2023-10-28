const BASE_PANEL_WIDTH = 450;
const BASE_PANEL_SIZES = [567, 450, 300];

figma.showUI(__html__);
figma.ui.resize(BASE_PANEL_WIDTH, 500);

figma.ui.onmessage = async message => {
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

  if (message.type === 'compact') {
    figma.ui.resize(500, 500);
  }

  if (message.type === 'expand') {
    figma.ui.resize(message.width, 500);
  }

  if (message.type === 'rename') {
    // await bulkRename(message.suffix);
    console.log('RENAME LIST', message.rules, message.layers);
    console.log('previous_child_selection', previous_child_selection);
    console.log('previous_parent_selection', previous_parent_selection);
    renameThem(previous_parent_selection, message.rules, message.layers['parentLayer']);
    renameThem(previous_child_selection, message.rules, message.layers['childLayer']);
  }
};

function renameThem(items: any[], rules: any, selectionLayer: any[]) {
  items.forEach((item, index) => {
    if (selectionLayer[index] && selectionLayer[index].checked) {
      let _startfrom = rules && typeof rules['incrementFrom'] === 'string' ? Number(rules['incrementFrom']) : 0;
      let _stepFor = rules && typeof rules['incrementStep'] === 'string' ? Number(rules['incrementStep']) : 1;

      _startfrom = index === 0 ? _startfrom : 0;
      _stepFor = index === 0 ? 0 : _stepFor;
      const _incrementValue = `_${index + _startfrom + _stepFor}`;
      renameIt(item, rules, _incrementValue);
      if (rules && rules['textcontent']) {
        retextIt(item, rules, _incrementValue);
      }
    }
  });
}
function renameIt(item: any, rules: any = {}, incrementValue = '') {
  const { prefix, suffix, basename, trimspace, increment } = rules;
  let newName = item.name;
  if (prefix) {
    newName = prefix + newName;
  }
  if (suffix) {
    newName = newName + suffix;
  }
  if (basename) {
    newName = prefix + basename + suffix;
  }
  if (trimspace) {
    newName = newName.replace(/\s/g, '');
  }
  if (increment) {
    newName = newName + incrementValue;
  }
  item.name = newName;
}

async function retextIt(item: any, rules: any = {}, incrementValue = '') {
  if (item.type === 'TEXT') {
    const { prefix, suffix, basename, trimspace, increment } = rules;
    let newName = item.characters;
    if (prefix) {
      newName = prefix + newName;
    }
    if (suffix) {
      newName = newName + suffix;
    }
    if (basename) {
      newName = prefix + basename + suffix;
    }
    if (trimspace) {
      newName = newName.replace(/\s/g, '');
    }
    if (increment) {
      newName = newName + incrementValue;
    }
    item.name = newName;

    try {
      await Promise.all(
        item.getRangeAllFontNames(0, item.characters.length)
          .map(figma.loadFontAsync)
      );
      item.autoRename = true;
      item.characters = newName;
    } catch (e) {
      console.log();
    }

  }
}

async function renameAChild(child: any, suffix = '') {
  const final_name = child.name + suffix;
  child.name = final_name;
  // if (child.type === 'TEXT') {
  //   const final_text = child.characters + suffix;
  //   await Promise.all(
  //     child.getRangeAllFontNames(0, child.characters.length)
  //       .map(figma.loadFontAsync)
  //   );
  //   child.autoRename = true;
  //   child.characters = final_text;
  // }
}

async function bulkRename(suffix = '') {
  const selection = figma.currentPage.selection;
  selection.forEach(async (item) => {
    // @ts-ignore
    console.log('item.children',item.children);
    // @ts-ignore
    if (item.children && item.children.length > 0) {
      // @ts-ignore
      item.children.forEach(child => renameAChild(child, suffix));
    } else {
      await renameAChild(item, suffix);
      const vs = await figma.saveVersionHistoryAsync('v12');
      console.log('vs', vs);
    }
  });
  // figma.saveVersionHistoryAsync((new Date().getTime()).toString());
  return null;
}

let previous_parent_selection: any[] = [];
let previous_child_selection: any[] = [];

/** Handle selection of current page */
const handleSelection = () => {
  // @ts-ignore
  const selection = previous_parent_selection = figma.currentPage.selection;
  console.log('selection', selection);
  const _selection  = selection.map((item) => {
    let _children: any[] = [];
    // @ts-ignore
    if (item.children) {
      // @ts-ignore
      const naturalLayerChildren = previous_child_selection = [...item.children].reverse();
      const childrenLogs = naturalLayerChildren?.map(_item => {
        return {
          label: `[${_item.type}]: ${_item.name}`,
          text: _item.children
        };
      });
      _children = [...childrenLogs];
    }
    const _parent = {
      label: `[${item.type}]: ${item.name}`,
      children: _children
    }
    return _parent;
  });

  figma.ui.postMessage({
    // logs: _logs.length > 0 ? _logs.pop() : [],
    selection: _selection.length > 0 ? _selection : []
  }, {origin: '*'});
};

/** Trigger on available selection, so that plugin knows about current selection without select again */
handleSelection();

/** Trigger on new selection */
figma.on('selectionchange', handleSelection);


