<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="utf8">
    <meta name="viewport" content="width=device-width">
    <title>Haussteuerung</title>
    <script src="runtime.js<?php if($_GET['force']) echo '?random='.rand(); ?>" async defer></script>
    <link rel="manifest" crossorigin="use-credentials" href="manifest.webmanifest">
    <link rel="icon" href="manifest_logo_haus196x196.jpg">
    <meta name="Description" content="Homematic IP Display and Manipulation">
    <style>
        body{
            max-width: 800px;
            background-color: white;
        }
        @media (prefers-color-scheme: dark) {
            body{
    	    	background-color: lightgray;
        	}
        }
        .actors {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(70px, auto));
            grid-template-columns: repeat(4, minmax(70px, auto));
        }

        [data-hm-adress] {
            font-size: 0.9rem;
            display: flex;
            flex-direction: column;

          /*  display: grid;*/
            margin: 0.2em;
            /* padding: 0.5em; */
            border-width: 0.3em;
            border-style: solid;
            border-color: transparent;
            background-origin: border-box;
        }
        [data-hm-adress] > * {
            margin-top: 0.5em;
        }
        [data-hm-adress] > *:first-child {
            margin-top: 0;
        }
        [data-hm-adress] > button {
            padding-top: 1em;
            padding-bottom: 1em;
        }
        [data-hm-adress] > .opVolt,
        [data-hm-adress] > .power,
        [data-hm-adress] > .temperature
        {
            font-size: xx-small;
            align-self: flex-end;
        }
/*        @media (max-width: 360px) and (min-width: 160px)  { */
            [data-hm-adress].colspan2 {
                grid-column-end: span 2;
                display: grid;
                grid-template-columns: repeat(2, auto);
                grid-gap:0.2em;
            }
            [data-hm-adress].colspan2 > *:first-child {
                grid-column-end: span 2;
            }
            [data-hm-adress].colspan4 {
                grid-column-end: span 4;
                display: grid;
                grid-template-columns: repeat(4, auto);
                grid-gap:0.2em;
            }
            [data-hm-adress].colspan4 > *:first-child {
                grid-column-end: span 4;
            }
/*        }*/



        .hm-power-state-on{
           background-color :yellow;
        }
        .hm-power-state-off{
           background-color :gray;
        }


        .hm-position-closed{
           background-color :green;
        }
        .hm-position-tilted{
           background-color :orange;
        }
        .hm-position-open{
           background-color :red;
        }

        .hm-smoke-idle{
           background-color :green;
        }
        .hm-smoke-primary{
           background-color :red;
        }
        .hm-smoke-secondary{
           background-color :indianred;
        }
        .hm-smoke-intrusion{
            background-color :yellow;
        }

        .hm-moisture-idle{
            background-color: green;
        }
        .hm-water-idle{
            background-color: green;
        }
        .hm-moisture-detected{
            background-color: orange;
        }
        .hm-water-detected{
            background-color: red;
        }


        .hm-full-bat{
            border-color :green;
        }
        .hm-low-bat{
            border-color :red;
        }
        .HmIP-KRC4{
            background-color :green;
        }
        .hm-low-bat.HmIP-KRC4{
            background-color :red;
        }
        .hm-unreachable{
            opacity: 0.55;
        }
        .hm-sabotage{
            opacity: 0.55;
        }
        .hm-sabotage{
            animation: blinkingDiv 1.2s infinite;
        }

        .hm-week-program-icon{
            font-size:x-small;
        }
        .hm-week-program-icon[hm-week-program-lock]{
            /** week programs */
            opacity: 0.5;
        }
        .hm-week-program-icon[hm-week-program-lock="0"]{
            /** all week programs */
           opacity: 1;
        }
        .hm-week-program-icon[hm-week-program-lock="7"]{
            /** no week programs */
           display: none;
        }

        @keyframes blinkingDiv{
            0%{     opacity: 1;    }
            49%{    opacity: 1; }
            60%{    opacity: 0; }
            99%{    opacity: 0;  }
            100%{   opacity: 1;    }
        }
    </style>
</head>

<body
data-hm-xmlapi-hostX="192.168.0.46"
data-hm-xmlapi-host="ccu3-wz"
>
    <noscript>This page uses client side scripting, so it needs JavaScript to be active.</noscript>
    <div class="actors">
<!-- LED Flur --> <div data-hm-adress="001A5A49985A3E" style="grid-column: 1 / -1;margin:0;"></div>

<!-- Markise -->   <div data-hm-adress="00115A499F41AF" class="colspan4"></div>

<!-- Licht DG Vera -->   <div data-hm-adress="00085A49901C43"></div>
<!-- Licht DG Laura -->   <div data-hm-adress="00085A49901A88"></div>
<!-- Licht DG AZ -->   <div data-hm-adress="00085A49A3F81D"></div>
<!-- CCU3 -->           <div data-hm-adress="HmIP-RCV-1" data-hm-override-index="1" data-hm-datapoint-type="PRESS_SHORT|PRESS_LONG" data-hm-datapoint-type-label="2&nbsp;Min|10&nbsp;Min"></div>

<!-- Rolladen DG Vera -->   <div data-hm-adress="00111A498BF94A"></div>
<!-- Rolladen DG Laura -->   <div data-hm-adress="00111A498BF963"></div>
<!-- Rolladen DG AZ -->   <div data-hm-adress="00111A498BF95C"></div>
<!-- Rolladen DG SZ -->   <div data-hm-adress="00111A498BF801"></div>

<!-- Verschluss DG Vera -->   <div data-hm-adress="0007DA49992FE4"></div>
<!-- Verschluss DG Laura -->   <div data-hm-adress="0007DA49992FF2"></div>
<!-- Verschluss DG AZ -->   <div data-hm-adress="0007DBE98D7382"></div>
<!-- Verschluss DG SZ -->   <div data-hm-adress="0007DA49992F5E"></div>

<!-- Verschluss EG WZ LL --> <div data-hm-adress="0007DBE98D7397"></div>
<!-- Verschluss EG WZ LR --> <div data-hm-adress="0007DBE98D7471"></div>
<!-- Verschluss EG WZ RL --> <div data-hm-adress="0007DBE98D738A"></div>
<!-- Verschluss EG WZ RR -->   <div data-hm-adress="0007DA4999323A"></div>

<!-- Verschluss EG WZ Fenster --> <div data-hm-adress="0007DBE98D736E"></div>
<!-- Verschluss EG Küche Fenster --> <div data-hm-adress="0007DBE98D7370"></div>
<!-- Verschluss EG Küche Tür -->   <div data-hm-adress="0007DBE98D7378"></div>
<!-- Verschluss EG Küche Schlüssel -->  <div data-hm-adress="00109A49A27CFF"></div>

<!-- Verschluss EG Bad -->   <div data-hm-adress="0007DA49903277"></div>
<!-- Verschluss EG Gast --> <div data-hm-adress="0007DBE98D7369"></div>
<!-- Verschluss EG Flur -->  <div data-hm-adress="00109A498FC33A"></div>
<!-- Verschluss DG Bad -->   <div data-hm-adress="0000DA498D222E"></div>

<!-- Wasser KG Sauna -->   <div data-hm-adress="001898A99F5399"></div>
<!-- Wasser KG Technik -->   <div data-hm-adress="001898A99F536C"></div>
<!-- FB Vera -->   <div data-hm-adress="0002DA499DDA49"></div>
<!-- FB Laura -->   <div data-hm-adress="0002DA499DDD0B"></div>

<!-- Rolladen EG WZ Tür links -->   <div data-hm-adress="00111A498BF95D"></div>
<!-- Rolladen EG WZ Tür rechts -->   <div data-hm-adress="00111A498BF92D"></div>
<!-- Rolladen EG Küche Fenster -->   <div data-hm-adress="00111A498BF962"></div>
<!-- Rolladen EG Küche Tür -->   <div data-hm-adress="00111A498BF927"></div>

<!-- Rolladen EG Bad -->   <div data-hm-adress="00111A498BF96B"></div>
<!-- Rolladen EG Gast -->   <div data-hm-adress="00111A498BF929"></div>
<!-- Rolladen EG Flur -->   <div data-hm-adress="00111A498BF945"></div>
<!-- Rolladen EG WZ Fenster -->   <div data-hm-adress="00111A498BF941"></div>

<!-- Heizung KG Spielen links -->   <div data-hm-adress="0001D3C99C6BCE"></div>
<!-- Heizung KG Spielen rechts -->   <div data-hm-adress="0001D3C99CB1D5"></div>
<!-- Licht Hausnr -->   <div data-hm-adress="00089A4996736F"></div>
<!-- Licht Haus Aussen -->   <div data-hm-adress="00085A49901C69"></div>

<!-- Rauch EG WZ -->   <div data-hm-adress="000A58A9AC4DCA"></div>
<!-- Rauch Garten -->   <div data-hm-adress="000A58A9AC4CB5"></div>
<!-- Rauch EG Gast -->   <div data-hm-adress="000A58A9AC4DC8"></div>
<!-- Rauch EG Flur -->   <div data-hm-adress="000A5A49A5A4F1"></div>

<!-- Rauch DG Laura -->   <div data-hm-adress="000A58A9AC4FA0"></div>
<!-- Rauch DG Vera -->   <div data-hm-adress="000A58A9AC4DC5"></div>
<!-- Rauch DG AZ -->   <div data-hm-adress="000A58A9AC4CCD"></div>
<!-- Rauch DG SZ -->   <div data-hm-adress="000A58A9AC4DC6"></div>

<!-- Rauch KG Spielen -->   <div data-hm-adress="000A58A9AC4DBD"></div>
<!-- Rauch KG Vorrat -->   <div data-hm-adress="000A58A9AC4C9F"></div>
<!-- Rauch KG Sauna -->   <div data-hm-adress="000A58A9AC4CD0"></div>
<!-- Rauch KG Technik -->   <div data-hm-adress="000A58A9AC4DBA"></div>

<!-- Rauch DG Flur -->   <div data-hm-adress="000A58A9AC4DB3"></div>
<!-- Rauch KG Flur -->   <div data-hm-adress="000A58A9AC4DB9"></div>
<!-- Rauch Spitzboden -->   <div data-hm-adress="000A58A9AC4CD2"></div>
<!-- Messgerät -->   <div data-hm-adress="0001D3C99C7401" data-hm-readonly></div>

<!-- Router Spitzboden -->   <div data-hm-adress="00021A4994A8FD" data-hm-readonly></div>
<!-- Licht DG AZ Tisch -->   <div data-hm-adress="0001D3C99C916E"></div>


    </div>
    <div id="output">

    </div>
</body>

</html>