<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="utf8">
    <meta name="viewport" content="width=device-width">
    <title>Haussteuerung</title>
    <script src="runtime.js" async defer></script>
    <link rel="manifest" crossorigin="use-credentials" href="manifest/manifest.webmanifest">
    <link rel="icon" href="manifest/manifest_logo_haus196x196.jpg">
    <meta name="Description" content="Homematic IP Display and Manipulation">
    <link href="index.css" rel="stylesheet">
    <style>
        /* Put own styles here */
    </style>
</head>

<!--
    @param data-hm-xmlapi-host IP or hostname (needs to be accessible from the runtime browser)
-->
<body
    data-hm-xmlapi-host="192.168.0.46"
>
    <noscript>This page uses client side scripting, so it needs JavaScript to be active.</noscript>
    <div class="notifications"></div>
    <div class="actors">
<!-- LED Flur --> <div data-hm-adress="001A5A49985A3E" style="grid-column: 1 / -1;margin:0;" data-hm-hide-actor-state data-hm-readonly></div>

<!-- Markise -->   <div data-hm-adress="00115A499F41AF" class="colspan4"></div>

<!-- Licht DG Vera -->   <div data-hm-adress="00085A49901C43"></div>
<!-- Licht DG Laura -->   <div data-hm-adress="00085A49901A88"></div>
<!-- Licht DG AZ -->   <div data-hm-adress="00085A49A3F81D"></div>
<!-- Licht DG SZ -->   <div data-hm-adress="00085BE9A005A9"></div>

<!-- Rolladen DG Vera -->   <div data-hm-adress="00111A498BF94A"></div>
<!-- Rolladen DG Laura -->   <div data-hm-adress="00111A498BF963"></div>
<!-- Rolladen DG AZ -->   <div data-hm-adress="00111A498BF95C"></div>
<!-- Rolladen DG SZ -->   <div data-hm-adress="00111A498BF801"></div>

<!-- Verschluss DG Vera -->   <div data-hm-adress="0007DA49992FE4"></div>
<!-- Verschluss DG Laura -->   <div data-hm-adress="0007DA49992FF2"></div>
<!-- Verschluss DG AZ -->   <div data-hm-adress="0007DBE98D7382"></div>
<!-- Verschluss DG SZ -->   <div data-hm-adress="0007DA49992F5E"></div>

<!-- Verschluss EG WZ LL --> <div data-hm-adress="0007DBE98D7397"></div>
<!-- Verschluss EG WZ RL --> <div data-hm-adress="0007DBE98D738A"></div>
<!-- Verschluss EG Küche Fenster --> <div data-hm-adress="0007DBE98D7370"></div>
<!-- Verschluss EG Küche Türgriff -->   <div data-hm-adress="0007DBE98D7378"></div>

<!-- Rolladen EG WZ Tür links -->   <div data-hm-adress="00111A498BF95D"></div>
<!-- Rolladen EG WZ Tür rechts -->   <div data-hm-adress="00111A498BF92D"></div>
<!-- Rolladen EG Küche Fenster -->   <div data-hm-adress="00111A498BF962"></div>
<!-- Rolladen EG Küche Tür -->   <div data-hm-adress="00111A498BF927" data-hm-potentially-unsafe-state-confirm></div>

<!-- Verschluss EG WZ LR --> <div data-hm-adress="0007DBE98D7471"></div>
<!-- Verschluss EG WZ RR -->   <div data-hm-adress="0007DA4999323A"></div>
<!-- Verschluss DG Bad -->   <div data-hm-adress="0000DA498D222E"></div>
<!-- Verschluss EG Küche Tür --> <div data-hm-adress="00109A49A27CFF"></div>

<!-- Wasser KG Sauna -->   <div data-hm-adress="001898A99F5399"></div>
<!-- Wasser KG Technik -->   <div data-hm-adress="001898A99F536C"></div>
<!-- Waschmaschine -->   <div data-hm-adress="0001D3C99C916E" data-hm-readonly></div>
<!-- Trockner -->   <div data-hm-adress="0001D3C99C7401" data-hm-readonly></div>


<!-- Rolladen EG Bad -->   <div data-hm-adress="00111A498BF96B"></div>
<!-- Rolladen EG Gast -->   <div data-hm-adress="00111A498BF929"></div>
<!-- Rolladen EG Flur -->   <div data-hm-adress="00111A498BF945"></div>
<!-- Rolladen EG WZ Fenster -->   <div data-hm-adress="00111A498BF941"></div>

<!-- Verschluss EG Bad -->   <div data-hm-adress="0007DA49903277"></div>
<!-- Verschluss EG Gast --> <div data-hm-adress="0007DBE98D7369"></div>
<!-- Verschluss EG Flur -->  <div data-hm-adress="00109A498FC33A"></div>
<!-- Verschluss EG WZ Fenster --> <div data-hm-adress="0007DBE98D736E"></div>


<!-- Heizung KG Spielen links -->   <div data-hm-adress="0001D3C99C6BCE" data-hm-safe-state-only></div>
<!-- Heizung KG Spielen rechts -->   <div data-hm-adress="0001D3C99CB1D5" data-hm-safe-state-only></div>
<!-- Router Spitzboden --> <div data-hm-adress="00021A4994A8FD" data-hm-readonly></div>
<!-- Rauch KG Technik -->   <div data-hm-adress="000A58A9AC4DBA"></div>

<!-- Rauch DG Laura -->   <div data-hm-adress="000A58A9AC4FA0"></div>
<!-- Rauch DG Vera -->   <div data-hm-adress="000A58A9AC4DC5"></div>
<!-- Rauch DG AZ -->   <div data-hm-adress="000A58A9AC4CCD"></div>
<!-- Rauch DG SZ -->   <div data-hm-adress="000A58A9AC4DC6"></div>

<!-- Rauch EG WZ -->   <div data-hm-adress="000A58A9AC4DCA"></div>
<!-- Rauch Garten -->   <div data-hm-adress="000A58A9AC4CB5"></div>
<!-- Rauch EG Flur -->   <div data-hm-adress="000A5A49A5A4F1"></div>
<!-- Rauch EG Gast -->   <div data-hm-adress="000A58A9AC4DC8"></div>

<!-- Rauch KG Spielen -->   <div data-hm-adress="000A58A9AC4DBD"></div>
<!-- Rauch KG Vorrat -->   <div data-hm-adress="000A58A9AC4C9F"></div>
<!-- Rauch KG Sauna -->   <div data-hm-adress="000A58A9AC4CD0"></div>
<!-- Rauch KG Flur -->   <div data-hm-adress="000A58A9AC4DB9"></div>

<!-- Rauch DG Flur -->   <div data-hm-adress="000A58A9AC4DB3"></div>
<!-- Rauch Spitzboden -->   <div data-hm-adress="000A58A9AC4CD2"></div>
<!-- FB Vera -->   <div data-hm-adress="0002DA499DDA49"></div>
<!-- FB Laura -->   <div data-hm-adress="0002DA499DDD0B"></div>


<!-- Wasser Küche -->   <div data-hm-adress="00189BE99769DF"></div>

<!-- Licht Hausnr -->   <div data-hm-adress="00089A4996736F"></div>
<!-- Licht Haus Aussen -->   <div data-hm-adress="00085A49901C69"></div>
<div data-hm-sysvar="DutyCycle" data-hm-readonly></div>

        <div data-hm-sysvar="SZ Rollladen nachts runter"></div>
        <div data-hm-sysvar="Anwesenheitssimulation"></div>
        <div data-hm-sysvar="Beschattung"></div>
<!-- CCU3 -->           <div data-hm-adress="HmIP-RCV-1" data-hm-override-index="1" data-hm-datapoint-type="PRESS_SHORT|PRESS_LONG" data-hm-datapoint-type-label="2&nbsp;Min|10&nbsp;Min"></div>


    </div>
    <div id="output">

    </div>
</body>

</html>