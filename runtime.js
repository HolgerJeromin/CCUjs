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
 * @param {string} string
 */
function ansiToNativeString(string) {
  return string.replace(/�/g, 'ü')
}

const statelistPromise =
  fetch(statelistUrl)
    .then((response) => {
      if (response && response.ok) {
        return response.text();
      } else {
        throw new Error('Something went wrong');
      }
    })
    .then(str => (new window.DOMParser()).parseFromString(str, "text/xml"))
    .then(data => {
      stateListDocument = data;
    })
  ;
const devicelistPromise =
fetch(devicelistUrl)
.then((response) => {
  if (response&&response.ok) {
    return response.text();
  } else {
    throw new Error('Something went wrong');
  }
})
  .then(str => (new window.DOMParser()).parseFromString(str, "text/xml"))
  .then(dataDocument=>{
    devicelistDocument = dataDocument;

  })
  .catch (ex => {
  console.error(ex);
  if (ex instanceof TypeError) {
    outputFnc('Error in request(parsing): ' + ex +
      '<br>You could try to open the <a target="_blank" href="' + devicelistUrl + '">url</a> manually.', 'color: red;');
  } else {
    outputFnc('Error in request(parsing): ' + ex, 'color: red;');
  }
})
  ;

Promise.all([devicelistPromise, statelistPromise])
  .then(() => {

    /** @type NodeListOf<HTMLElement> */
    let allHomematicDivs = document.querySelectorAll('[data-hm-adress]');

    for (const homematicDiv of allHomematicDivs) {
      const deviceBaseadress = homematicDiv.dataset.hmAdress;
      let deviceNode = devicelistDocument.querySelector(
        'device[address="' + homematicDiv.dataset.hmAdress + '"]'
      );
      if (!deviceNode) {
        continue;
      }
      homematicDiv.appendChild(document.createTextNode(ansiToNativeString(deviceNode.getAttribute('name'))));
      /** @type number|undefined */
      let actorIndex = undefined;
      /** @type number|undefined */
      let statusIndex = undefined;
      /** @type string|undefined */
      let datapointType;
      switch (deviceNode.getAttribute('device_type')) {
        case 'HmIP-BROLL': // UP Rolladen
          {
            actorIndex = 4; statusIndex = 3;
            datapointType = 'LEVEL';
            let actorDatapoint = getDatapointInfo(homematicDiv.dataset.hmAdress,
              actorIndex, datapointType
            );
            homematicDiv.appendChild(createButton('Hoch', '1', actorDatapoint.iseId));
            homematicDiv.appendChild(createButton('Halb', '0.6', actorDatapoint.iseId));
            homematicDiv.appendChild(createButton('Streifen', '0.2', actorDatapoint.iseId));
            homematicDiv.appendChild(createButton('Runter', '0', actorDatapoint.iseId));
            let statusDatapointId = getDatapointInfo(homematicDiv.dataset.hmAdress,
              statusIndex, datapointType
            );
            setInterval(() => {
              getHomematicValue(statusDatapointId.iseId)
                .then((valueStr) => {
                  let value = parseFloat(valueStr);
                  if (isNaN(value)) {
                    homematicDiv.style.background  = 'red';
                  } else if (value == 0) {
                    homematicDiv.style.background = 'gray';
                  } else if (value <= 0.2) {
                    homematicDiv.style.background  = 'repeating-linear-gradient(gray, gray 20px, green 20px, green 25px)';
                  } else {
                    homematicDiv.style.background = 'linear-gradient(0deg, green ' + ((value - 0.2) * (100/80))*100 + '%, gray 0)'
                  }

                  // if (valueStr === 'true') {
                  //   homematicDiv.style.backgroundColor = 'yellow';
                  // } else if (valueStr === 'false') {
                  //   homematicDiv.style.backgroundColor = 'gray';
                  // } else {
                  //   homematicDiv.style.backgroundColor = 'red';
                  // }
                });
            }, 1000);
            break;
          }
        case 'HMIP-PSM': // Power Switch Measurement
          {
            actorIndex = 3; statusIndex = 2;
            datapointType = 'STATE';
            let actorDatapoint = getDatapointInfo(homematicDiv.dataset.hmAdress,
              actorIndex, datapointType
            );
            homematicDiv.appendChild(createButton('An', 'true', actorDatapoint.iseId));
            homematicDiv.appendChild(createButton('Aus', 'false', actorDatapoint.iseId));
            let statusDatapoint = getDatapointInfo(homematicDiv.dataset.hmAdress,
              statusIndex, datapointType
            );
            setInterval(() => {
              getHomematicValue(statusDatapoint.iseId)
                .then((valueStr) => {
                  if (valueStr === 'true') {
                    homematicDiv.style.backgroundColor = 'yellow';
                  } else if (valueStr === 'false') {
                    homematicDiv.style.backgroundColor = 'gray';
                  }
                });
            }, 1000);
            break;
          }
        case 'HmIP-FSM': // flush-mounted Switch Measurement
          {
            actorIndex = 2; statusIndex = 1;
            datapointType = 'STATE';
            let actorDatapoint = getDatapointInfo(homematicDiv.dataset.hmAdress,
              actorIndex, datapointType
            );
            homematicDiv.appendChild(createButton('An', 'true', actorDatapoint.iseId));
            homematicDiv.appendChild(createButton('Aus', 'false', actorDatapoint.iseId));
            let statusDatapoint = getDatapointInfo(homematicDiv.dataset.hmAdress,
              statusIndex, datapointType
            );
            setInterval(() => {
              getHomematicValue(statusDatapoint.iseId)
                .then((valueStr) => {
                  if (valueStr === 'true') {
                    homematicDiv.style.backgroundColor = 'yellow';
                  } else if (valueStr === 'false') {
                    homematicDiv.style.backgroundColor = 'gray';
                  }
                });
            }, 1000);
            break;
          }
        case 'HmIP-BSM': // UP Switch Measurement
          {
            actorIndex = 4; statusIndex = 3;
            datapointType = 'STATE';
            let actorDatapoint = getDatapointInfo(homematicDiv.dataset.hmAdress,
              actorIndex, datapointType
            );
            homematicDiv.appendChild(createButton('An', 'true', actorDatapoint.iseId));
            homematicDiv.appendChild(createButton('Aus', 'false', actorDatapoint.iseId));
            let statusDatapoint = getDatapointInfo(homematicDiv.dataset.hmAdress,
              statusIndex, datapointType
            );
            setInterval(() => {
              getHomematicValue(statusDatapoint.iseId)
                .then((valueStr) => {
                  if (valueStr === 'true') {
                    homematicDiv.style.backgroundColor = 'yellow';
                  } else if (valueStr === 'false') {
                    homematicDiv.style.backgroundColor = 'gray';
                  }
                });
            }, 1000);
            break;
          }
        case 'HMIP-SWDO': // Window sensor
          {
            statusIndex = 1;
            datapointType = 'STATE';
            let statusDatapoint = getDatapointInfo(homematicDiv.dataset.hmAdress,
              statusIndex, datapointType
            );
            setInterval(() => {
              getHomematicValue(statusDatapoint.iseId)
                .then((valueStr) => {
                  if (valueStr === '0') {
                    homematicDiv.style.backgroundColor = 'green';
                  } else if (valueStr === '1') {
                    homematicDiv.style.backgroundColor = 'red';
                  }
                });
            }, 1000);
            break;
          }
        case 'HmIP-SWD': // Water sensor
          {
            statusIndex = 1;
            datapointType = 'WATERLEVEL_DETECTED';
            let statusDatapoint = getDatapointInfo(homematicDiv.dataset.hmAdress,
              statusIndex, datapointType
            );
            setInterval(() => {
              getHomematicValue(statusDatapoint.iseId)
                .then((valueStr) => {
                  if (valueStr === 'true') {
                    homematicDiv.style.backgroundColor = 'red';
                  } else if (valueStr === 'false') {
                    homematicDiv.style.backgroundColor = 'green';
                  }
                });
            }, 1000);
            break;
          }
        case 'HmIP-RCV-50':
          {
            // Special
            actorIndex = 1;
            datapointType = 'PRESS_SHORT';
            let actorDatapoint = getDatapointInfo(homematicDiv.dataset.hmAdress,
              actorIndex, datapointType
            );
            homematicDiv.appendChild(createButton('2&nbsp;Min', '1', actorDatapoint.iseId));
            datapointType = 'PRESS_LONG';
            actorDatapoint = getDatapointInfo(homematicDiv.dataset.hmAdress,
              actorIndex, datapointType
            );
            homematicDiv.appendChild(createButton('10&nbsp;Min', '1', actorDatapoint.iseId));
            homematicDiv.firstChild.nodeValue = actorDatapoint.name;
            break;
          }
        default:
          {
            const errorDiv = document.createElement('div');
            errorDiv.innerHTML = 'Aktor des Typs <span style="color:red;">' + deviceNode.getAttribute('device_type') + '</span> nicht bekannt.';
            homematicDiv.appendChild(errorDiv);
            break;
          }
      }
    }
    outputFnc('');
  });

  /**
   *
   * @param {string} hmAdress
   * @param {number} actorIndex
   * @param {string} datapointType
   */
function getDatapointInfo(hmAdress, actorIndex, datapointType) {
  let deviceChannelNode = devicelistDocument.querySelector(
    'channel[address="'
    + hmAdress + ':' + actorIndex
    + '"]'
  );
  let channel_ise_id = deviceChannelNode.getAttribute('ise_id');
  let datapointNode = stateListDocument.querySelector(
    'channel[ise_id="' + channel_ise_id + '"] datapoint[type="' + datapointType + '"]'
  );
  return { name: deviceChannelNode.getAttribute('name'), iseId: datapointNode.getAttribute('ise_id') };
}


/**
 * @param {MouseEvent} evt
 * @this {HTMLElement}
 */
function clickHandler(evt) {
  const target = this;
  let message;
  if (
    target.parentElement.firstChild.nodeValue.includes('Vera')
    || target.parentElement.firstChild.nodeValue.includes('Laura')
  ) {
    message = 'Wirklich einen Aktor bei den Kindern schalten?';
  } else if (target.parentElement.firstChild.nodeValue.includes('Heizung')) {
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
    outputFnc('Success in writing value: '+target.dataset.hmActorValue, 'color: green;');
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
    .then(str => (new window.DOMParser()).parseFromString(str, "text/xml"))
    .catch(ex => {
      console.error(ex);
    })
    ;
}
/**
 *
 * @param {string|string[]} ise_id
 */
function getMultipleHomematicValue(ise_id) {
  let iseArr;
  if (!Array.isArray(ise_id)) {
    iseArr = [ise_id];
  } else {
    iseArr = ise_id;
  }
  return fetch(
    stateUrl
    + '?' + 'datapoint_id=' + iseArr.join(',')
  )
    .then(response => response.text())
    .then(str => (new window.DOMParser()).parseFromString(str, "text/xml"))
    .then(data => {
      let valueArr = [];
      iseArr.forEach(id => {
        valueArr.push(data.querySelector('datapoint["ise_id=' + id + '"]')?.getAttribute('value'));
      });
      return valueArr;
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
    .then(str => (new window.DOMParser()).parseFromString(str, "text/xml"))
    .then(data => {
      return data.querySelector('datapoint[ise_id="' + ise_id + '"]')?.getAttribute('value');
    })
    .catch(ex => {
      console.error(ex);
      throw new Error('Unexpected error');
    })
    ;
}

/** @type {Map<HTMLElement>} */
const monitorList = new Map();
/**
 *
 * @param {HTMLElement} homematicDiv
 * @param {string|undefined} datapointId
 */
function addHmMonitoring(homematicDiv, datapointId, { }) {

  // monitorList.set(homematicDiv, { statusIndex: statusIndex, datapointType: datapointType });
}
