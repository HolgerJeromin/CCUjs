/// @ts-check

const host = '//ccu3-wz';
const baseXMLAPIpath = '/addons/xmlapi/';

const devicelistUrl = host + baseXMLAPIpath + 'devicelist.cgi';
const statelistUrl = host + baseXMLAPIpath + 'statelist.cgi';
const valuechangeUrl = host + baseXMLAPIpath + 'mastervaluechange.cgi';
const statechangeUrl = host + baseXMLAPIpath + 'statechange.cgi';

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
    devicelistDocument=dataDocument;
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
      homematicDiv.appendChild(document.createTextNode(deviceNode.getAttribute('name')));
      /** @type number|undefined */
      let actorIndex = undefined;
      /** @type string|undefined */
      let datapointType;
      switch (deviceNode.getAttribute('device_type')) {
        case 'HmIP-BROLL': // UP Rolladen
          actorIndex = 4;
          datapointType = 'LEVEL';
          // let datapoint_ise_id = getDatapointId(
          //   homematicDiv.dataset.hmAdress,
          //   actorIndex,
          //   datapointType
          // );
          homematicDiv.appendChild(createButton('Hoch', '1', actorIndex, datapointType));
          homematicDiv.appendChild(createButton('Halb', '0.6', actorIndex, datapointType));
          homematicDiv.appendChild(createButton('Streifen', '0.2', actorIndex, datapointType));
          homematicDiv.appendChild(createButton('Runter', '0', actorIndex, datapointType));
          addHmMonitoring(homematicDiv, 3, datapointType);
          break;
        case 'HMIP-PSM': // Power Switch Measurement
          actorIndex = 3;
          datapointType = 'STATE';
          homematicDiv.appendChild(createButton('An', 'true', actorIndex, datapointType));
          homematicDiv.appendChild(createButton('Aus', 'false', actorIndex, datapointType));
          addHmMonitoring(homematicDiv, 2, datapointType);
          break;
        case 'HmIP-BSM': // UP Switch Measurement
          actorIndex = 4;
          datapointType = 'STATE';
          homematicDiv.appendChild(createButton('An', 'true', actorIndex, datapointType));
          homematicDiv.appendChild(createButton('Aus', 'false', actorIndex, datapointType));
          addHmMonitoring(homematicDiv, 3, datapointType);
          break;


        case 'HmIP-RCV-50':
          // Special
          actorIndex = 1;
          datapointType = 'PRESS_SHORT';
          homematicDiv.appendChild(createButton('Kurz', '1', actorIndex, datapointType));
          break;
        default:
          const errorDiv = document.createElement('div');
          errorDiv.innerHTML = 'Aktor des Typs <span style="color:red;">' + deviceNode.getAttribute('device_type') + '</span> nicht bekannt.';
          homematicDiv.appendChild(errorDiv);
          break;
      }
    }
    outputFnc('');
  })
  .catch (ex => {
  console.error(ex);
  if (ex instanceof TypeError) {
    outputFnc('Error in request(parsing): ' + ex +
      '<br>You could try to open the <a href="' + devicelistUrl + '">url</a> manually.', 'color: red;');
  } else {
    outputFnc('Error in request(parsing): ' + ex, 'color: red;');
  }
})
;
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

function getDatapointId(hmAdress, actorIndex, datapointType) {
  let channel_ise_id = devicelistDocument.querySelector(
    'channel[address="'
    + hmAdress + ':' + actorIndex
    + '"]'
  ).getAttribute('ise_id');
  let datapointNode = stateListDocument.querySelector(
    'channel[ise_id="' + channel_ise_id + '"] datapoint[type="' + datapointType + '"]'
  );
  return datapointNode.getAttribute('ise_id');
}


/**
 * @param {MouseEvent} evt
 * @this {HTMLElement}
 */
function clickHandler(evt) {
  const target = this;
  let datapoint_ise_id = getDatapointId(
    target.parentElement.dataset.hmAdress,
    target.dataset.hmActorIndex,
    target.dataset.hmDatapointType
  );
  setHomematicValue(
    datapoint_ise_id,
    target.dataset.hmActorValue
  )
  .then(data => {
    console.log(data);
    outputFnc('Success in writing value: '+target.dataset.hmActorValue, 'color: green;');
  })
}

/**
 *
 * @param {string} title
 * @param {string} value
 * @param {number} actorIndex
 * @param {string} datapointType
 */
function createButton(title, value, actorIndex, datapointType = '', classList = []) {
  const button = document.createElement('button');
  button.addEventListener('click', clickHandler);
  button.innerText = title;
  button.dataset.hmActorValue = value;
  button.dataset.hmActorIndex = actorIndex.toString();
  button.dataset.hmDatapointType = datapointType;
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
/** @type {Map<HTMLElement>} */
const monitorList = new Map();
/**
 *
 * @param {HTMLElement} homematicDiv
 * @param {number|undefined} statusIndex
 */
function addHmMonitoring(homematicDiv, statusIndex, datapointType = '') {
  let datapoint_ise_id = getDatapointId(
    homematicDiv.dataset.hmAdress,
    statusIndex,
    datapointType
  );
  monitorList.set(homematicDiv, { statusIndex: statusIndex, datapointType: datapointType });
}
