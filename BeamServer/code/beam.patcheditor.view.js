var PATCH_DICT_ID = jsarguments[1];
var PROFILES_DICT_ID = jsarguments[2];

var patchDict = new Dict(PATCH_DICT_ID);
var patchObj = {};

var profilesDict = new Dict(PROFILES_DICT_ID);
var profilesObj = {};

function loadPatchDict() {
  patchObj = JSON.parse(patchDict.stringify());
}

function loadProfilesDict() {
  profilesObj = JSON.parse(profilesDict.stringify());
}

var TARGET_PATCHER = this.patcher;

/* GUI dimensions */

var ROW_WIDTH = 525;
var ROW_HEIGHT = 23;
var BODY_MARGIN_TOP = 0;
var BODY_MARGIN_LEFT = 0;
var INSPECTOR_WIDTH = 229;
var INSPECTOR_FIXTUREDATA_HEIGHT = 174;
var INSPECTOR_CHILDDATA_HEIGHT = 146;
var INSPECTOR_CELLDATA_HEIGHT = 50;
var INSPECTOR_TAGS_HEIGHT = 252;
var INSPECTOR_TEST_HEIGHT = 24;

var TOTAL_WIDTH = 775;
var TOTAL_HEIGHT = 465;

/* Utility functions */

function getNestedValue(obj, path) {
  var keys = path.split("::");
  var targetCell = obj;
  keys.forEach(function (key) {
    var parts = key.split("[");
    var prop = parts[0];
    var index = parseInt(parts[1].slice(0, -1));
    targetCell = targetCell[prop][index];
  });
  return targetCell;
}

/* Fixture profiles dropdown */

function CreateProfileNameList() {
  var profileNameList = [];

  loadProfilesDict();

  for (profileName in profilesObj) {
    profileNameList.push(profileName);
  }

  return profileNameList;
}

function populateProfilesDropdown() {
  var dropdown = this.patcher.getnamed("profilesMenu");

  dropdown.clear();
  dropdown.append("(Select Profile)");

  var profileNameList = CreateProfileNameList();
  for (var i = 0; i < profileNameList.length; i++) {
    dropdown.append(profileNameList[i]);
  }
}

function CreateModeNameList(profile) {
  var modeNameList = [];

  loadProfilesDict();

  for (modeName in profilesObj[profile].modes) {
    modeNameList.push(modeName);
  }

  return modeNameList;
}

function populateModesDropdown(profile) {
  var dropdown = this.patcher.getnamed("modesMenu");

  dropdown.clear();

  var modeNameList = CreateModeNameList(profile);

  dropdown.arrow(modeNameList.length > 0 ? 1 : 0);

  for (var i = 0; i < modeNameList.length; i++) {
    dropdown.append(modeNameList[i]);
  }
}

/* Fixture list */

function createFixtureListItem(data, gui) {
  var row;

  row = gui.targetPatcher.newdefault(
    0,
    0,
    "bpatcher",
    "beam.patcheditor.FixtureListItem",
    "@args",
    PATCH_DICT_ID,
    data.parentFixtureIndex,
    "@varname",
    "fixture" + data.parentFixtureIndex + "::" + "-1"
  );

  row.rect = [
    gui.positionX,
    gui.positionY,
    gui.positionX + gui.width,
    gui.positionY + gui.height,
  ];

  return row;
}

function createFixtureListChildItem(data, gui) {
  var row;

  row = gui.targetPatcher.newdefault(
    0,
    0,
    "bpatcher",
    "beam.patcheditor.FixtureListChildItem",
    "@args",
    PATCH_DICT_ID,
    data.parentFixtureIndex,
    data.subitemIndexOrPath,
    "@varname",
    "fixture" + data.parentFixtureIndex + "::" + data.subitemIndexOrPath
  );

  row.rect = [
    gui.positionX,
    gui.positionY,
    gui.positionX + gui.width,
    gui.positionY + gui.height,
  ];

  return row;
}

function getCellsDataArray(
  parentFixtureIndex,
  cellsArray,
  pathPrefix,
  levelPrefix
) {
  var cellsDataArray = [];

  for (var cellIndex = 0; cellIndex < cellsArray.length; cellIndex++) {
    var pathSuffix = "::cells[" + cellIndex + "]";
    var currentLevelPrefix = levelPrefix + "—";
    cellsDataArray.push({
      parentFixtureIndex: parentFixtureIndex,
      cellPath:
        "fixtures[" + parentFixtureIndex + "]" + pathPrefix + pathSuffix,
      levelPrefix: currentLevelPrefix,
    });

    var subcells = cellsArray[cellIndex].cells
      ? cellsArray[cellIndex].cells
      : [];
    cellsDataArray.push.apply(
      cellsDataArray,
      getCellsDataArray(
        parentFixtureIndex,
        subcells,
        pathSuffix,
        currentLevelPrefix
      )
    );
  }

  return cellsDataArray;
}

function createFixtureListCellItem(data, gui) {
  var row;

  row = gui.targetPatcher.newdefault(
    0,
    0,
    "bpatcher",
    "beam.patcheditor.FixtureListCellItem",
    "@args",
    PATCH_DICT_ID,
    data.parentFixtureIndex,
    data.cellPath,
    data.levelPrefix,
    "@varname",
    data.cellPath
  );

  row.rect = [
    gui.positionX,
    gui.positionY,
    gui.positionX + gui.width,
    gui.positionY + gui.height,
  ];

  return row;
}

var currentFixtureListItems = [];
function createFixtureListTable() {
  loadPatchDict();

  for (var i = 0; i < currentFixtureListItems.length; i++) {
    TARGET_PATCHER.remove(currentFixtureListItems[i]);
  }

  var fixtures = patchObj.fixtures;
  if (!fixtures) return;

  var totalFixtureIndex = 0;
  for (var i = 0; i < fixtures.length; i++) {
    var fixture = fixtures[i];

    var fixtureData = {
      parentFixtureIndex: i,
    };

    var fixtureGui = {
      targetPatcher: TARGET_PATCHER,
      positionX: BODY_MARGIN_LEFT,
      positionY: totalFixtureIndex * ROW_HEIGHT + BODY_MARGIN_TOP,
      width: ROW_WIDTH,
      height: ROW_HEIGHT,
    };

    currentFixtureListItems.push(
      createFixtureListItem(fixtureData, fixtureGui)
    );

    totalFixtureIndex++;

    for (var j = 0; j < fixture.children.length; j++) {
      var childFixtureData = {
        parentFixtureIndex: i,
        subitemIndexOrPath: j,
      };

      var childFixtureGui = {
        targetPatcher: TARGET_PATCHER,
        positionX: BODY_MARGIN_LEFT,
        positionY: totalFixtureIndex * ROW_HEIGHT + BODY_MARGIN_TOP,
        width: ROW_WIDTH,
        height: ROW_HEIGHT,
      };

      currentFixtureListItems.push(
        createFixtureListChildItem(childFixtureData, childFixtureGui)
      );

      totalFixtureIndex++;
    }

    if (!fixture.cells) {
      continue;
    } else {
      var cells = getCellsDataArray(i, fixture.cells, "", "");
      for (var j = 0; j < cells.length; j++) {
        var cellData = cells[j];
        var cellGui = {
          targetPatcher: TARGET_PATCHER,
          positionX: BODY_MARGIN_LEFT,
          positionY: totalFixtureIndex * ROW_HEIGHT + BODY_MARGIN_TOP,
          width: ROW_WIDTH,
          height: ROW_HEIGHT,
        };

        currentFixtureListItems.push(
          createFixtureListCellItem(cellData, cellGui)
        );

        totalFixtureIndex++;
      }
    }
  }
}

/* Fixture inspector */

function createFixtureInspectorData(data, gui) {
  var element;

  element = gui.targetPatcher.newdefault(
    0,
    0,
    "bpatcher",
    "beam.patcheditor.FixtureInspectorData",
    "@args",
    PATCH_DICT_ID,
    PROFILES_DICT_ID,
    data.parentFixtureIndex,
    "@varname",
    "fixture" + data.parentFixtureIndex + "::" + "-1"
  );

  element.rect = [
    gui.positionX,
    gui.positionY,
    gui.positionX + gui.width,
    gui.positionY + gui.height,
  ];

  return element;
}

function createFixtureInspectorChildData(data, gui) {
  var element;

  element = gui.targetPatcher.newdefault(
    0,
    0,
    "bpatcher",
    "beam.patcheditor.FixtureInspectorChildData",
    "@args",
    PATCH_DICT_ID,
    data.parentFixtureIndex,
    data.subitemIndexOrPath,
    "@varname",
    "fixture" + data.parentFixtureIndex + "::" + data.subitemIndexOrPath
  );

  element.rect = [
    gui.positionX,
    gui.positionY,
    gui.positionX + gui.width,
    gui.positionY + gui.height,
  ];

  return element;
}

function createFixtureInspectorCellData(data, gui) {
  var element;

  element = gui.targetPatcher.newdefault(
    0,
    0,
    "bpatcher",
    "beam.patcheditor.FixtureInspectorCellData",
    "@args",
    PATCH_DICT_ID,
    data.parentFixtureIndex,
    data.subitemIndexOrPath,
    "@varname",
    data.subitemIndexOrPath
  );

  element.rect = [
    gui.positionX,
    gui.positionY,
    gui.positionX + gui.width,
    gui.positionY + gui.height,
  ];

  return element;
}

var currentFixtureInspectorElements = [];
function createFixtureInspector(parentFixtureIndex, subitemIndexOrPath) {
  var inspectorType =
    typeof subitemIndexOrPath === "number"
      ? subitemIndexOrPath == -1
        ? "fixture"
        : "child"
      : typeof subitemIndexOrPath === "string"
      ? "cell"
      : null;
  if (!inspectorType) return;

  loadPatchDict();

  for (var i = 0; i < currentFixtureInspectorElements.length; i++) {
    TARGET_PATCHER.remove(currentFixtureInspectorElements[i]);
  }

  var fixtureData = {
    parentFixtureIndex: parentFixtureIndex,
    subitemIndexOrPath: subitemIndexOrPath,
  };

  var dataHeight =
    inspectorType === "fixture"
      ? INSPECTOR_FIXTUREDATA_HEIGHT
      : inspectorType === "child"
      ? INSPECTOR_CHILDDATA_HEIGHT
      : INSPECTOR_CELLDATA_HEIGHT;

  var fixtureGui = {
    targetPatcher: TARGET_PATCHER,
    positionX: 0,
    positionY: 0,
    width: INSPECTOR_WIDTH,
    height: dataHeight,
  };

  var tagsGui = {
    targetPatcher: TARGET_PATCHER,
    positionX: 0,
    positionY: dataHeight,
    width: INSPECTOR_WIDTH,
    height: INSPECTOR_TAGS_HEIGHT,
  };

  var testGui = {
    targetPatcher: TARGET_PATCHER,
    positionX: 0,
    positionY: dataHeight + INSPECTOR_TAGS_HEIGHT + 6,
    width: INSPECTOR_WIDTH,
    height: INSPECTOR_TEST_HEIGHT,
  };

  if (inspectorType == "fixture") {
    currentFixtureInspectorElements.push(
      createFixtureInspectorData(fixtureData, fixtureGui)
    );
    currentFixtureInspectorElements.push(
      createFixtureInspectorTags(fixtureData, tagsGui)
    );
    currentFixtureInspectorElements.push(
      createFixtureInspectorTest(fixtureData, testGui)
    );
  } else if (inspectorType == "child") {
    currentFixtureInspectorElements.push(
      createFixtureInspectorChildData(fixtureData, fixtureGui)
    );
    currentFixtureInspectorElements.push(
      createFixtureInspectorChildTags(fixtureData, tagsGui)
    );
  } else if (inspectorType == "cell") {
    currentFixtureInspectorElements.push(
      createFixtureInspectorCellData(fixtureData, fixtureGui)
    );
    currentFixtureInspectorElements.push(
      createFixtureInspectorCellTags(fixtureData, tagsGui)
    );
  }
}

function createFixtureInspectorTagListItem(data, gui) {
  var row;

  row = gui.targetPatcher.newdefault(
    0,
    0,
    "bpatcher",
    "beam.patcheditor.FixtureInspectorTagsItem",
    "@args",
    PATCH_DICT_ID,
    data.parentFixtureIndex,
    data.tagIndex,
    "@varname",
    "fixture" + data.parentFixtureIndex + "::" + "-1"
  );

  row.rect = [
    gui.positionX,
    gui.positionY,
    gui.positionX + gui.width,
    gui.positionY + gui.height,
  ];

  return row;
}

function createFixtureInspectorChildTagListItem(data, gui) {
  var row;

  row = gui.targetPatcher.newdefault(
    0,
    0,
    "bpatcher",
    "beam.patcheditor.FixtureInspectorChildTagsItem",
    "@args",
    PATCH_DICT_ID,
    data.parentFixtureIndex,
    data.subitemIndexOrPath,
    data.tagIndex,
    "@varname",
    data.subitemIndexOrPath
  );

  row.rect = [
    gui.positionX,
    gui.positionY,
    gui.positionX + gui.width,
    gui.positionY + gui.height,
  ];

  return row;
}

function createFixtureInspectorCellTagListItem(data, gui) {
  var row;

  row = gui.targetPatcher.newdefault(
    0,
    0,
    "bpatcher",
    "beam.patcheditor.FixtureInspectorCellTagsItem",
    "@args",
    PATCH_DICT_ID,
    data.parentFixtureIndex,
    data.subitemIndexOrPath,
    data.tagIndex,
    "@varname",
    data.subitemIndexOrPath
  );

  row.rect = [
    gui.positionX,
    gui.positionY,
    gui.positionX + gui.width,
    gui.positionY + gui.height,
  ];

  return row;
}

var currentFixtureInspectorTags = [];
function createFixtureInspectorTagList(parentFixtureIndex) {
  loadPatchDict();

  for (var i = 0; i < currentFixtureInspectorTags.length; i++) {
    TARGET_PATCHER.remove(currentFixtureInspectorTags[i]);
  }

  var fixtures = patchObj.fixtures;
  if (!fixtures) return;

  var fixture = fixtures[parentFixtureIndex];
  if (!fixture) return;

  var tags = fixture["tags"];
  for (var i = 0; i < tags.length; i++) {
    var tag = tags[i];

    var tagData = {
      parentFixtureIndex: parentFixtureIndex,
      tagIndex: i,
    };

    var tagGui = {
      targetPatcher: TARGET_PATCHER,
      positionX: BODY_MARGIN_LEFT,
      positionY: i * ROW_HEIGHT + BODY_MARGIN_TOP + 23,
      width: INSPECTOR_WIDTH,
      height: ROW_HEIGHT,
    };

    currentFixtureInspectorTags.push(
      createFixtureInspectorTagListItem(tagData, tagGui)
    );
  }
}

var currentFixtureInspectorChildTags = [];
function createFixtureInspectorChildTagList(
  parentFixtureIndex,
  subitemIndexOrPath
) {
  loadPatchDict();

  for (var i = 0; i < currentFixtureInspectorChildTags.length; i++) {
    TARGET_PATCHER.remove(currentFixtureInspectorChildTags[i]);
  }

  var fixtures = patchObj.fixtures;
  if (!fixtures) return;

  var fixture = fixtures[parentFixtureIndex];

  var tags = fixture.children[subitemIndexOrPath].tags;
  if (!tags) return;

  for (var i = 0; i < tags.length; i++) {
    var tagData = {
      parentFixtureIndex: parentFixtureIndex,
      subitemIndexOrPath: subitemIndexOrPath,
      tagIndex: i,
    };

    var tagGui = {
      targetPatcher: TARGET_PATCHER,
      positionX: BODY_MARGIN_LEFT,
      positionY: i * ROW_HEIGHT + BODY_MARGIN_TOP + 23,
      width: INSPECTOR_WIDTH,
      height: ROW_HEIGHT,
    };

    currentFixtureInspectorChildTags.push(
      createFixtureInspectorChildTagListItem(tagData, tagGui)
    );
  }
}

var currentFixtureInspectorCellTags = [];
function createFixtureInspectorCellTagList(parentFixtureIndex, cellPath) {
  loadPatchDict();

  for (var i = 0; i < currentFixtureInspectorCellTags.length; i++) {
    TARGET_PATCHER.remove(currentFixtureInspectorCellTags[i]);
  }

  var fixtures = patchObj.fixtures;
  if (!fixtures) return;

  var fixture = fixtures[parentFixtureIndex];
  if (!fixture) return;

  var tags = getNestedValue(patchObj, cellPath).tags;
  if (!tags) return;

  for (var i = 0; i < tags.length; i++) {
    var tagData = {
      parentFixtureIndex: parentFixtureIndex,
      subitemIndexOrPath: cellPath,
      tagIndex: i,
    };

    var tagGui = {
      targetPatcher: TARGET_PATCHER,
      positionX: BODY_MARGIN_LEFT,
      positionY: i * ROW_HEIGHT + BODY_MARGIN_TOP + 23,
      width: INSPECTOR_WIDTH,
      height: ROW_HEIGHT,
    };

    currentFixtureInspectorCellTags.push(
      createFixtureInspectorCellTagListItem(tagData, tagGui)
    );
  }
}

function createFixtureInspectorTags(data, gui) {
  var element;

  element = gui.targetPatcher.newdefault(
    0,
    0,
    "bpatcher",
    "beam.patcheditor.FixtureInspectorTags",
    "@args",
    PATCH_DICT_ID,
    PROFILES_DICT_ID,
    data.parentFixtureIndex
  );

  element.rect = [
    gui.positionX,
    gui.positionY,
    gui.positionX + gui.width,
    gui.positionY + gui.height,
  ];

  element.enablevscroll(1);

  return element;
}

function createFixtureInspectorChildTags(data, gui) {
  var element;

  element = gui.targetPatcher.newdefault(
    0,
    0,
    "bpatcher",
    "beam.patcheditor.FixtureInspectorChildTags",
    "@args",
    PATCH_DICT_ID,
    PROFILES_DICT_ID,
    data.parentFixtureIndex,
    data.subitemIndexOrPath
  );

  element.rect = [
    gui.positionX,
    gui.positionY,
    gui.positionX + gui.width,
    gui.positionY + gui.height,
  ];

  element.enablevscroll(1);

  return element;
}

function createFixtureInspectorCellTags(data, gui) {
  var element;

  element = gui.targetPatcher.newdefault(
    0,
    0,
    "bpatcher",
    "beam.patcheditor.FixtureInspectorCellTags",
    "@args",
    PATCH_DICT_ID,
    PROFILES_DICT_ID,
    data.parentFixtureIndex,
    data.subitemIndexOrPath
  );

  element.rect = [
    gui.positionX,
    gui.positionY,
    gui.positionX + gui.width,
    gui.positionY + gui.height,
  ];

  element.enablevscroll(1);

  return element;
}

function createFixtureInspectorTest(data, gui) {
  var element;

  element = gui.targetPatcher.newdefault(
    0,
    0,
    "bpatcher",
    "beam.patcheditor.FixtureInspectorTest",
    "@args",
    PATCH_DICT_ID,
    PROFILES_DICT_ID,
    data.parentFixtureIndex
  );

  element.rect = [
    gui.positionX,
    gui.positionY,
    gui.positionX + gui.width,
    gui.positionY + gui.height,
  ];

  return element;
}

function deselectFixtureInspector() {
  for (var i = 0; i < currentFixtureInspectorElements.length; i++) {
    TARGET_PATCHER.remove(currentFixtureInspectorElements[i]);
  }
}

/* Fixture creator modal */

function createFixtureCreatorOverlay(gui) {
  var element;

  element = gui.targetPatcher.newdefault(
    0,
    0,
    "bpatcher",
    "beam.patcheditor.CreatorOverlay",
    "@args",
    PATCH_DICT_ID,
    PROFILES_DICT_ID
  );

  element.rect = [
    gui.positionX,
    gui.positionY,
    gui.positionX + gui.width,
    gui.positionY + gui.height,
  ];

  return element;
}

var fixtureCreator;
function createFixtureCreator() {
  var gui = {
    targetPatcher: TARGET_PATCHER,
    positionX: 0,
    positionY: 0,
    width: TOTAL_WIDTH,
    height: TOTAL_HEIGHT,
  };

  fixtureCreator = createFixtureCreatorOverlay(gui);
  TARGET_PATCHER.bringtofront(fixtureCreator);
}

function removeFixtureCreator() {
  TARGET_PATCHER.remove(fixtureCreator);
}

/* Parent bpatcher */

function resizeParentBpatcher() {
  this.patcher.box.varname = "bp_" + Math.random() * 10000;
  this.patcher.parentpatcher.message(
    "script",
    "sendbox",
    this.patcher.box.varname,
    "patching_size",
    776,
    467
  );
  this.patcher.box.varname = "";
}
