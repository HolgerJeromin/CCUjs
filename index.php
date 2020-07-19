<html>

<head>
    <meta charset="utf8">
    <meta name="viewport" content="width=device-width">
    <title>Haussteuerung</title>
    <script src="runtime.js<?php if($_GET['force']) echo "?random=".rand(); ?>" async defer></script>
    <link rel="icon" href="rm-favicon.ico" type="image/vnd.microsoft.icon">
    <style>
        .actors {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(70px, auto));
        }

        [data-hm-adress] {
            display: flex;
            flex-direction: column;

          /*  display: grid;*/
            margin: 0.2em;
            /* padding: 0.5em; */
            border-width: 0.3em;
            border-style: solid;
            border-color: transparent;
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
    </style>
</head>

<body>
    <div class="actors">
<!-- Rolladen DG Laura -->   <div data-hm-adress="00111A498BF963"></div>
<!-- Rolladen DG Vera -->   <div data-hm-adress="00111A498BF94A"></div>
<!-- Rolladen DG AZ -->   <div data-hm-adress="00111A498BF95C"></div>
<!-- Rolladen DG SZ -->   <div data-hm-adress="00111A498BF801"></div>

<!-- Licht DG Laura -->   <div data-hm-adress="00085A49901A88"></div>
<!-- Licht DG Vera -->   <div data-hm-adress="00085A49901C43"></div>
<!-- Licht DG AZ -->   <div data-hm-adress="00085A49A3F81D"></div>
<!-- Licht DG AZ Tisch -->   <div data-hm-adress="0001D3C99C916E"></div>

<!-- Verschluss DG Laura -->   <div data-hm-adress="0007DA49992FF2"></div>
<!-- Verschluss DG Vera -->   <div data-hm-adress="0007DA49992FE4"></div>
<!-- Verschluss DG AZ -->   <div data-hm-adress="00109A498FC33A"></div>
<!-- Verschluss DG SZ -->   <div data-hm-adress="0007DA49992F5E"></div>

<!-- Verschluss  EG Küche Tür -->   <div data-hm-adress="00109A49A27CFF"></div>
<!-- Verschluss  EG WZ Tür rechts -->   <div data-hm-adress="0007DA4999323A"></div>
<!-- Verschluss  EG Bad -->   <div data-hm-adress="0007DA49903277"></div>

<!-- Verschluss DG Bad -->   <div data-hm-adress="0000DA498D222E"></div>
<!-- Wasser KG Sauna -->   <div data-hm-adress="001898A99F5399"></div>
<!-- Wasser KG Technik -->   <div data-hm-adress="001898A99F536C"></div>
<!-- FB Laura -->   <div data-hm-adress="0002DA499DDD0B"></div>

<!-- CCU3 -->           <div data-hm-adress="001F98A9AABDDD" data-hm-override-index="1" data-hm-datapoint-type="PRESS_SHORT|PRESS_LONG" data-hm-datapoint-type-label="2&nbsp;Min|10&nbsp;Min"></div>

<!-- Rolladen EG WZ Fenster -->   <div data-hm-adress="00111A498BF941"></div>
<!-- Rolladen EG WZ Tür links -->   <div data-hm-adress="00111A498BF95D"></div>
<!-- Rolladen EG WZ Tür rechts -->   <div data-hm-adress="00111A498BF92D"></div>

<!-- Rolladen EG Küche Fenster -->   <div data-hm-adress="00111A498BF962"></div>
<!-- Rolladen EG Küche Tür -->   <div data-hm-adress="00111A498BF927"></div>

<!-- Rolladen EG Bad -->   <div data-hm-adress="00111A498BF96B"></div>
<!-- Rolladen EG Gast -->   <div data-hm-adress="00111A498BF929"></div>
<!-- Rolladen EG Flur -->   <div data-hm-adress="00111A498BF945"></div>

<!-- Heizung KG Spielen links -->   <div data-hm-adress="0001D3C99C6BCE"></div>
<!-- Heizung KG Spielen rechts -->   <div data-hm-adress="0001D3C99CB1D5"></div>
<!-- Licht Haus Aussen -->   <div data-hm-adress="00085A49901C69"></div>
<!-- Licht Hausnr -->   <div data-hm-adress="00089A4996736F"></div>

<!-- Rauch Garten -->   <div data-hm-adress="000A5A49A5A4F1"></div>
<!-- Rauch EG WZ -->   <div data-hm-adress="000A58A9AC4DCA"></div>
<!-- Rauch EG Gast -->   <div data-hm-adress="000A58A9AC4DC8"></div>
<!-- Rauch EG Flur -->   <div data-hm-adress="000A58A9AC4CB5"></div>

<!-- Rauch DG Laura -->   <div data-hm-adress="000A58A9AC4FA0"></div>
<!-- Rauch DG Vera -->   <div data-hm-adress="000A58A9AC4DC5"></div>
<!-- Rauch DG AZ -->   <div data-hm-adress="000A58A9AC4CCD"></div>
<!-- Rauch DG SZ -->   <div data-hm-adress="000A58A9AC4DC6"></div>

<!-- Rauch DG Flur -->   <div data-hm-adress="000A58A9AC4DB3"></div>
<!-- Rauch Spitzboden -->   <div data-hm-adress="000A58A9AC4CD2"></div>

<!-- Rauch KG Flur -->   <div data-hm-adress="000A58A9AC4DB9"></div>
<!-- Rauch KG Spielen -->   <div data-hm-adress="000A58A9AC4DBD"></div>
<!-- Rauch KG Vorrat -->   <div data-hm-adress="000A58A9AC4C9F"></div>
<!-- Rauch KG Sauna -->   <div data-hm-adress="000A58A9AC4CD0"></div>
<!-- Rauch KG Technik -->   <div data-hm-adress="000A58A9AC4DBA"></div>

<!-- Messgerät do not switch! -->   <div data-hm-adress="0001D3C99C7401" data-hm-readonly></div>
<!-- Markise -->   <div data-hm-adress="00115A499F41AF"></div>

<!-- Router Spitzboden -->   <div data-hm-adress="00021A4994A8FD" data-hm-readonly></div>


    </div>
    <div id="output">

    </div>
</body>

</html>