/// @ts-check

const host = '//ccu3-wz';
const baseXMLAPIpath = '/addons/xmlapi/';

const devicelistUrl = host + baseXMLAPIpath + 'devicelist.cgi';
const statelistUrl = host + baseXMLAPIpath + 'statelist.cgi';
const valuechangeUrl = host + baseXMLAPIpath + 'mastervaluechange.cgi';
const statechangeUrl = host + baseXMLAPIpath + 'statechange.cgi';

/** @type document */
let devicelistDocument;

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
fetch(  devicelistUrl)
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
      const deviceType = homematicDiv.dataset.homematicType;
      const deviceBaseadress = homematicDiv.dataset.hmAdress;
      let deviceNode = devicelistDocument.querySelector('device[address="'+homematicDiv.dataset.hmAdress+'"]');
      if(!deviceNode){
        continue;
      }
      homematicDiv.appendChild(document.createTextNode(deviceNode.getAttribute('name')));
      /** @type number|undefined */
      let actorAdress = undefined;
      /** @type number|undefined */
      let iseOffset = 0;
      switch (deviceNode.getAttribute('device_type')) {
        case 'HmIP-BROLL': // UP Rolladen
          actorAdress = 4;
          homematicDiv.appendChild(createButton('Hoch', '1', actorAdress));
          homematicDiv.appendChild(createButton('Halb', '0.6', actorAdress));
          homematicDiv.appendChild(createButton('Streifen', '0.2', actorAdress));
          homematicDiv.appendChild(createButton('Runter', '0', actorAdress));
          break;
        case 'HMIP-PSM': // Power Switch Measurement
            actorAdress = 3;
            homematicDiv.appendChild(createButton('An', 'true', actorAdress));
            homematicDiv.appendChild(createButton('Aus', 'false', actorAdress));
            break;
        case 'HmIP-BSM': // UP Switch Measurement
          actorAdress = 5;
          iseOffset = -1;
          homematicDiv.appendChild(createButton('An', 'true', actorAdress, iseOffset));
          homematicDiv.appendChild(createButton('Aus', 'false', actorAdress, iseOffset));
        break;


        case 'HmIP-RCV-50XX':
          // Special
          actorAdress = 1;
          homematicDiv.appendChild(createButton('Kurz', '1', actorAdress));
          //homematicDiv.appendChild(createButton('Aus', 'false', actorAdress));
          break;
        default:
          const errorDiv = document.createElement('div');
          errorDiv.innerHTML='Aktor des Typs <span style="color:red;">'+deviceNode.getAttribute('device_type')+'</span> nicht bekannt.';
          homematicDiv.appendChild(errorDiv);
          break;
      }
    }
    outputFnc('');
  })
  .catch(ex => {
    console.error(ex);
    if (ex instanceof TypeError) {
      outputFnc('Error in request(parsing): ' + ex +
        '<br>You could try to open the <a href="' + devicelistUrl + '">url</a> manually.', 'color: red;');
    } else {
      outputFnc('Error in request(parsing): ' + ex, 'color: red;');
    }
  })
  ;


/**
 * @param {MouseEvent} evt
 * @this {HTMLElement}
 */
function clickHandler(evt) {
  const target = this;
//  console.log('target', target, 'parent', target.parentElement);
  let channelNode = devicelistDocument.querySelector(
    'channel[address="'
    +target.parentElement.dataset.hmAdress+':'+target.dataset.hmActorAdress
    +'"]'
  );
  let ise_id = parseInt(channelNode.getAttribute('ise_id'), 10);
  if(target.dataset.hmIseOffset){
    ise_id += parseInt(target.dataset.hmIseOffset, 10);
  }
  setHomematicValue(
    ise_id,
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
 * @param {number} actorAdress
 * @param {number} iseOffset
 */
function createButton(title, value, actorAdress, iseOffset = 0, classList = []) {
  const button = document.createElement('button');
  button.addEventListener('click', clickHandler);
  button.innerText = title;
  button.dataset.hmActorValue = value;
  button.dataset.hmActorAdress = actorAdress.toString();
  button.dataset.hmIseOffset = iseOffset.toString();
  button.classList.add(...classList);
  return button;
}

/**
 *
 * @param {number|number[]} ise_id
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
