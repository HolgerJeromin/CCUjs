/// @ts-check

const host = '//ccu3-wz';
const baseXMLAPIpath = '/addons/xmlapi/';

const devicelistUrl = host + baseXMLAPIpath + 'devicelist.cgi';
const statelistUrl = host + baseXMLAPIpath + 'statelist.cgi';
const valuechangeUrl = host + baseXMLAPIpath + 'mastervaluechange.cgi';
const statechangeUrl = host + baseXMLAPIpath + 'statechange.cgi';
const stateUrl = host + baseXMLAPIpath + 'state.cgi';

/** @type document */
let devicelistDocument;

/** @type document */
let stateListDocument;

let DomParser = new window.DOMParser();
// const xhr = new XMLHttpRequest();
// xhr.open('GET', statelistUrl,false);
// xhr.send();
const outputElem = document.getElementById('output');
/**
 *
 * @param {string|object} message
 * @param {string} cssText
 */
const outputFnc = (message, cssText = '') => {
  outputElem.innerHTML = message;
  outputElem.style.cssText = cssText;
}

outputFnc('loading...');

/**
 *
 * @param {string} xmlString
 * @param {'devicelist'|'statelist'|string} type
 */
const stringToDocument = (xmlString, type) => {
  if (!xmlString) {
    return false;
  }
  let doc = (DomParser).parseFromString(xmlString, "text/xml");
  switch (type) {
    case 'devicelist':
      devicelistDocument = doc;
      break;
    case 'statelist':
      stateListDocument = doc;
      break;
  }
  // if (typeof db !== 'undefined') {
  //   db.transaction("xmlApiCache").objectStore(type).add(doc).onsuccess = function (event) {
  //     console.log('saved document', type);
  //   };
  // }
  return true;
}

// const openDBrequest = window.indexedDB.open("xmlApiCache", 1);
// /** @type {IDBDatabase} */
// let db;
// openDBrequest.onerror = function (event) {
//   console.error(event);
// };
// openDBrequest.onupgradeneeded = function () {
//   db = openDBrequest.result;
//   db.createObjectStore('devicelist');
//   db.createObjectStore('statelist');
// }
// openDBrequest.onsuccess = (event) => {
//   db = event.target.result;

//   // db.transaction("xmlApiCache").objectStore("devicelist").add("devicelist").onsuccess = function (event) {
//   //   console.log("Name for SSN 444-44-4444 is " + event.target.result);
//   // };
//   let requestDeviceList = db.transaction("xmlApiCache").objectStore("devicelist").get("devicelist");
//   requestDeviceList.onsuccess = function (event) {
//     debugger;
//     if (event.target.result) {
//       console.log('Found a devicelist', event.target.result);
//     } else {
//       console.log('Found no devicelist');
//     }
//   };
//   requestDeviceList.onerror = function (event) {
//     debugger;
//     console.log(event.target.result);
//   };
// }

const statelistPromise =
  fetch(statelistUrl)
    .then((response) => {
      if (response && response.ok) {
        return response.text();
      } else {
        throw new Error('Something went wrong');
      }
    })
    .then(str => {
      try {
        window.localStorage.setItem('statelist', str);
      } catch (error) {
        // skip
      }
      return str;
    })
    .then(str => stringToDocument(str, 'statelist'))
  ;
const devicelistPromise =
  fetch(devicelistUrl)
    .then((response) => {
      if (response && response.ok) {
        return response.text();
      } else {
        throw new Error('Something went wrong');
      }
    })
    .then(str => {
      try {
        window.localStorage.setItem('devicelist', str);
      } catch (error) {
        // skip
      }
      return str;
     })
    .then(str => stringToDocument(str, 'devicelist'))
    .catch(ex => {
      console.error(ex);
      if (ex instanceof TypeError) {
        outputFnc('Error in request(parsing): ' + ex +
          '<br>You could try to open the <a target="_blank" href="' + devicelistUrl + '">url</a> manually.', 'color: red;');
      } else {
        outputFnc('Error in request(parsing): ' + ex, 'color: red;');
      }
    })
  ;

let parseSuccess = true;
const list = ['devicelist', 'statelist'];
for (let listId = 0; listId < list.length && parseSuccess; listId++) {
  parseSuccess = stringToDocument(window.localStorage.getItem(list[listId]), list[listId])
}
if (parseSuccess) {
  renderGui();
} else {
  Promise.all([devicelistPromise, statelistPromise])
    .then(renderGui);
}

/**
 * @param {string} string
 */
function ansiToNativeString(string) {
  return string.replace(/�/g, 'ü')
}

function renderGui() {
  /** @type NodeListOf<HTMLElement> */
  let allHomematicDivs = document.querySelectorAll('[data-hm-adress]');

  for (const homematicDiv of allHomematicDivs) {
    const deviceBaseadress = homematicDiv.dataset.hmAdress;
    let overrideIndex = homematicDiv.dataset.hmOverrideIndex;
    let overrideDatapointTypeArr = homematicDiv.dataset.hmDatapointType?.split('|');
    let overrideDatapointTypeLabelArr = homematicDiv.dataset.hmDatapointTypeLabel?.split('|');
    let datapointType;
    let deviceInfo = getDeviceInfo(homematicDiv.dataset.hmAdress, datapointType, overrideIndex);
    let labelDiv = document.createElement('div');
    labelDiv.classList.add('label');
    labelDiv.innerText = ansiToNativeString(deviceInfo.device.deviceName);
    homematicDiv.appendChild(labelDiv);
    //homematicDiv.appendChild(document.createTextNode(ansiToNativeString(deviceInfo.deviceName)));
    homematicDiv.title = deviceInfo.device.type;
    /** @type string|undefined */
    switch (deviceInfo.device.type) {
      case 'HmIP-BROLL': // UP Rolladen
        {
          datapointType = 'LEVEL';
          let deviceInfo = getDeviceInfo(homematicDiv.dataset.hmAdress, datapointType, overrideIndex);
          homematicDiv.appendChild(createButton('Hoch', '1', deviceInfo.firstStateOrLevel.iseId));
          homematicDiv.appendChild(createButton('Halb', '0.6', deviceInfo.firstStateOrLevel.iseId));
          homematicDiv.appendChild(createButton('Streifen', '0.2', deviceInfo.firstStateOrLevel.iseId));
          homematicDiv.appendChild(createButton('Runter', '0', deviceInfo.firstStateOrLevel.iseId));

          const updateState = () => {
            getHomematicValue(deviceInfo.firstStateOrLevel.iseId)
              .then((valueStr) => {
                let value = parseFloat(valueStr);
                if (isNaN(value)) {
                  homematicDiv.style.background = 'red';
                } else if (value == 0) {
                  homematicDiv.style.background = 'gray';
                } else if (value <= 0.2) {
                  homematicDiv.style.background = 'repeating-linear-gradient(gray, gray 20px, green 20px, green 25px)';
                } else {
                  homematicDiv.style.background = 'linear-gradient(0deg, green ' + ((value - 0.2) * (100 / 80)) * 100 + '%, gray 0)'
                }
              });
            setTimeout(updateState, 1000);
          };
          updateState();
          break;
        }
      case 'HMIP-PSM': // Power Switch Measurement
      case 'HmIP-FSM': // flush-mounted Switch Measurement
      case 'HmIP-BSM': // UP Switch Measurement
        {
          datapointType = 'STATE';
          let deviceInfo = getDeviceInfo(homematicDiv.dataset.hmAdress, datapointType);
          homematicDiv.appendChild(createButton('An', 'true', deviceInfo.firstStateOrLevel.iseId));
          homematicDiv.appendChild(createButton('Aus', 'false', deviceInfo.firstStateOrLevel.iseId));
          const updateState = () => {
            getHomematicValue(deviceInfo.firstStateOrLevel.iseId)
              .then((valueStr) => {
                if (valueStr === 'true') {
                  homematicDiv.style.backgroundColor = 'yellow';
                } else if (valueStr === 'false') {
                  homematicDiv.style.backgroundColor = 'gray';
                }
              })
            setTimeout(updateState, 1000);
          };
          updateState();
          break;
        }
      case 'HMIP-SWDO': // Window sensor
      case 'HmIP-SWDO-I': // integrated
        {
          datapointType = 'STATE';
          let deviceInfo = getDeviceInfo(homematicDiv.dataset.hmAdress, datapointType);
          const updateState = () => {
            getHomematicValue(deviceInfo.firstStateOrLevel.iseId)
              .then((valueStr) => {
                if (valueStr === '0') {
                  homematicDiv.style.backgroundColor = 'green';
                } else if (valueStr === '1') {
                  homematicDiv.style.backgroundColor = 'red';
                }
              })
          };
          setInterval(updateState, 1000);
          break;
        }
      case 'HmIP-SWD': // Water sensor
        {
          datapointType = 'WATERLEVEL_DETECTED';
          let deviceInfo = getDeviceInfo(homematicDiv.dataset.hmAdress, datapointType);
          const updateState = () => {
            getHomematicValue(deviceInfo.firstStateOrLevel.iseId)
              .then((valueStr) => {
                if (valueStr === 'true') {
                  homematicDiv.style.backgroundColor = 'red';
                } else if (valueStr === 'false') {
                  homematicDiv.style.backgroundColor = 'green';
                }
              });
            setTimeout(updateState, 1000);
          };
          updateState();
          break;
        }
      case 'HmIP-RCV-50':
        {
          // Special
          if (!overrideDatapointTypeArr) {
            homematicDiv.firstChild.nodeValue = 'missing datapoint info';
            break;
          }
          for (let i = 0; i < overrideDatapointTypeArr.length; i++) {
            let deviceInfo = getDeviceInfo(homematicDiv.dataset.hmAdress, overrideDatapointTypeArr[i], overrideIndex);
            homematicDiv.appendChild(createButton(overrideDatapointTypeLabelArr[i], '1', deviceInfo.firstStateOrLevel.iseId));
            homematicDiv.firstChild.nodeValue = deviceInfo.firstStateOrLevelDatapointName;
          }
          break;
        }
      default:
        {
          const errorDiv = document.createElement('div');
          errorDiv.innerHTML = 'Aktor des Typs <span style="color:red;">' + deviceInfo.device.type + '</span> nicht bekannt.';
          homematicDiv.appendChild(errorDiv);
          break;
        }
    }

    if (deviceInfo.tempDatapoint.iseId) {
      getHomematicValue(deviceInfo.tempDatapoint.iseId)
        .then(data => {
          let temp = parseFloat(data);
          if (!Number.isNaN(temp) && temp !== 0) {
            let tempDiv = document.createElement('div');
            tempDiv.classList.add('temperature');
            tempDiv.innerText = temp.toLocaleString(undefined, {
              maximumFractionDigits: 1,
              minimumFractionDigits: 1
            }) + '°C';
            homematicDiv.appendChild(tempDiv);
          }
        });
    }
  }
  outputFnc('');
}

/**
 *
 * @param {string} hmAdress
 * @param {string} datapointType
 * @param {string|undefined} overrideIndex
 */
function getDeviceInfo(hmAdress, datapointType = undefined, overrideIndex = undefined) {
  let deviceList_deviceNode = devicelistDocument.querySelector(
    'device[address="' + hmAdress + '"]'
  );
  let deviceIse = deviceList_deviceNode.getAttribute('ise_id');
  let firstActorChannelNode = deviceList_deviceNode.querySelector('channel[direction="RECEIVER"]');
  let firstActorChannelIndex = firstActorChannelNode?.getAttribute('index') ?? overrideIndex;

  let stateList_deviceNode = stateListDocument.querySelector(
    'device[ise_id="' + deviceIse + '"]'
  );

  let firstStateOrLevelDatapointNode;
  if (datapointType) {
    if (firstActorChannelIndex !== undefined) {
      let stateList_firstActorChannelNode =
        stateList_deviceNode.querySelector('channel[index="' + firstActorChannelIndex + '"]');
      firstStateOrLevelDatapointNode =
        stateList_firstActorChannelNode?.querySelector('datapoint[type="' + datapointType + '"]');
    } else {
      // No Actor. Find first datapointType
      firstStateOrLevelDatapointNode =
        stateList_deviceNode.querySelector('datapoint[type="' + datapointType + '"]');
    }
  }
  let tempDatapointNode =
    stateList_deviceNode.querySelector('datapoint[type="' + 'ACTUAL_TEMPERATURE' + '"]');

  return {
    device: {
      type: deviceList_deviceNode.getAttribute('device_type'),
      deviceName: deviceList_deviceNode?.getAttribute('name')
    },
    firstActorChannel: {
      iseId: firstActorChannelNode?.getAttribute('ise_id'),
      index: firstActorChannelNode?.getAttribute('index')
    },
    firstStateOrLevel: {
      iseId: firstStateOrLevelDatapointNode?.getAttribute('ise_id'),
      name: firstStateOrLevelDatapointNode?.parentElement?.getAttribute('name')
    },
    tempDatapoint: {
      iseId: tempDatapointNode?.getAttribute('ise_id'),
      name: tempDatapointNode?.getAttribute('name')
    }
  };
}


/**
 * @param {MouseEvent} evt
 * @this {HTMLElement}
 */
function clickHandler(evt) {
  const target = this;
  let message;
  /** @type {HTMLElement} */
  let labelDiv = target.parentElement.querySelector('.label');
  if (
    labelDiv.firstChild.nodeValue.includes('Vera')
    || labelDiv.firstChild.nodeValue.includes('Laura')
  ) {
    message = 'Wirklich einen Aktor bei den Kindern schalten?';
  } else if (labelDiv.firstChild.nodeValue.includes('Heizung')) {
    message = 'Wirklich eine Heizung schalten?';
  }

  if (message && !confirm(message)) {
    return;
  }
  setHomematicValue(
    target.dataset.hmActorDatapointId,
    target.dataset.hmActorValue
  )
    .then(data => {
      outputFnc('Success in writing value: ' + target.dataset.hmActorValue, 'color: green;');
    })
}

/**
 *
 * @param {string} title
 * @param {string} value
 * @param {string} datapointId
 */
function createButton(title, value, datapointId, classList = []) {
  const button = document.createElement('button');
  button.addEventListener('click', clickHandler);
  button.innerHTML = title;
  button.dataset.hmActorValue = value;
  button.dataset.hmActorDatapointId = datapointId;
  button.classList.add(...classList);
  return button;
}

/**
 *
 * @param {string|string[]} ise_id
 * @param {string|string[]} value
 */
function setHomematicValue(ise_id, value) {
  if (!Array.isArray(ise_id)) {
    ise_id = [ise_id];
  }
  if (!Array.isArray(value)) {
    value = [value];
  }
  return fetch(
    statechangeUrl
    + '?' + 'ise_id=' + ise_id.join(',')
    + '&' + 'new_value=' + value.join(',')
  )
    .then(response => response.text())
    .then(str => (DomParser).parseFromString(str, "text/xml"))
    .catch(ex => {
      console.error(ex);
    })
    ;
}

/**
 *
 * @param {string[]} iseIds
 */
function getMultipleHomematicValue(iseIds) {
  return fetch(
    stateUrl
    + '?' + 'datapoint_id=' + iseIds.join(',')
  )
    .then(response => response.text())
    .then(str => (DomParser).parseFromString(str, "text/xml"))
    .then(data => {
      /**@type {Map<string, string>} */
      let valueMap = new Map();
      iseIds.forEach(id => {
        valueMap.set(id, data.querySelector('datapoint[ise_id="' + id + '"]')?.getAttribute('value'));
      });
      return valueMap;
    })
    .catch(ex => {
      console.error(ex);
      throw new Error('Unexpected error');
    })
    ;
}

/**
 *
 * @param {string} ise_id
 */
function getHomematicValue(ise_id) {
  return fetch(
    stateUrl
    + '?' + 'datapoint_id=' + ise_id
  )
    .then(response => response.text())
    .then(str => (DomParser).parseFromString(str, "text/xml"))
    .then(data => {
      return data.querySelector('datapoint[ise_id="' + ise_id + '"]')?.getAttribute('value');
    })
    .catch(ex => {
      console.error(ex);
      throw new Error('Unexpected error');
    })
    ;
}

/** key is the iseId
 * @type {Map<string, Set<(hmValue: string)=>void>>} */
const monitorList = new Map();
/**
 *
 * @param {string|undefined} iseId
 * @param {()=>void} callback
 */
function addHmMonitoring(iseId, callback) {
  if (!iseId) {
    return;
  }
  let subSet = monitorList.get(iseId);
  if (!subSet) {
    subSet = new Set();
    monitorList.set(iseId, subSet);
  }
  subSet.add(callback);
}

let hmMonitoring = function () {
  if (monitorList.size) {
    getMultipleHomematicValue(Array.from(monitorList.keys()))
      .then(resultMap => {
        resultMap.forEach((hmValue, iseId) => {
          let cbList = monitorList.get(iseId);
          cbList.forEach(cb => {
            cb(hmValue);
          })
        })
      });
  }
  setTimeout(hmMonitoring, 10000);
};
hmMonitoring();
