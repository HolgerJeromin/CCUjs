# CCUjs
GUI for Homematic Devices like CCU or other devices with [RaspberryMatic](https://raspberrymatic.de/) using [XML API](https://github.com/homematic-community/XML-API).

## Usage

* Download repository
* Copy index_template.html to index.html
* Duplicate the template line for all your actors/sensors and adjust them with your device address: `<div data-hm-address="0001D3C99C916E"></div>`

## Hosting on RaspberryMatic

Hosting on the RaspberryMatic has the advantage that you have no http/https problems.

* Remove IP `data-hm-xmlapi-host="xy"` in index.html
* Copy files to `/usr/local/etc/config/addons/www/CCUjs` then you can open the webpage under http://ccu3-webui/addons/CCUjs/

## Hosting on own webserver
You can host this progressive web app on your own webserver. But than you need to handle http/https problems.

* Adjust IP `<body data-hm-xmlapi-host="192.168.0.46">`

## Using as Progressive Web App (PWA)
This page is programmed as a PWA which allows you to save it on your homescreen (at least on Android) via browser menu "Add to homescreen".
