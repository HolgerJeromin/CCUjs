<html>

<head>
    <meta charset="utf8">
    <meta name="viewport" content="width=device-width">
    <title>Haussteuerung</title>
    <script src="runtime.js<?php if($_GET['force']) echo "?random=".rand(); ?>" async defer></script>
    <link rel="shortcut icon" href="rm-favicon.ico" type="image/vnd.microsoft.icon">
    <link rel="icon" href="rm-favicon.ico" type="image/vnd.microsoft.icon">
    <style>
        #actors {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(70px, auto));
        }

        [data-hm-adress] {
            display: flex;
            flex-direction: column;


          /*  display: grid;*/
            margin: 0.2em;
            padding: 0.5em;
        }
        [data-hm-adress] > * {
            margin-top: 0.5em;
        }
        [data-hm-adress] > button {
            padding-top: 1em;
            padding-bottom: 1em;
            margin-top: 0.5em;
        }
    </style>
</head>

<body>
    <div id="actors">
        <!-- Roll Laura -->     <div data-hm-adress="00111A498BF963"></div>
        <!-- Roll Vera -->      <div data-hm-adress="00111A498BF94A"></div>
        <!-- Roll AZ -->        <div data-hm-adress="00111A498BF95C"></div>
        <!-- Roll SZ -->        <div data-hm-adress="00111A498BF801"></div>

        <!-- Licht Laura -->    <div data-hm-adress="00085A49901A88"></div>
        <!-- Licht Vera -->     <div data-hm-adress="00085A49901C43"></div>
        <!-- Licht AZ -->       <div data-hm-adress="0001D3C99C916E"></div>
        <!-- Licht aussen -->   <div data-hm-adress="00085A49901C69"></div>

        <!-- Fenster Bad DG --> <div data-hm-adress="0000DA498D222E"></div>
        <!-- Fenster EG WZ rechts --> <div data-hm-adress="00109A498FC33A"></div>
        <!-- Fenster EG Küchentür --> <div data-hm-adress="00109A49A27CFF"></div>
        <!-- Wasser Sauna -->   <div data-hm-adress="001898A99F5399"></div>

        <!-- CCU3 -->           <div data-hm-adress="001F98A9AABDDD" data-hm-override-index="1" data-hm-datapoint-type="PRESS_SHORT|PRESS_LONG" data-hm-datapoint-type-label="2&nbsp;Min|10&nbsp;Min"></div>
        <!-- Wasser Technik -->   <div data-hm-adress="001898A99F536C"></div>
        <!-- Heizung KG Spielen links -->   <div data-hm-adress="0001D3C99C6BCE"></div>
        <!-- Heizung KG Spielen rechts -->   <div data-hm-adress="0001D3C99CB1D5"></div>

        <!-- Rolladen EG Bad -->   <div data-hm-adress="00111A498BF96B"></div>
        <!-- Rolladen EG Gast -->   <div data-hm-adress="00111A498BF929"></div>
        <!-- Rolladen EG Küche Fenster -->   <div data-hm-adress="00111A498BF962"></div>
        <!-- Rolladen EG Küche Tür -->   <div data-hm-adress="00111A498BF927"></div>

        <!-- Rolladen EG Flur -->   <div data-hm-adress="00111A498BF945"></div>
        <!-- Rolladen EG WZ Fenster -->   <div data-hm-adress="00111A498BF941"></div>
        <!-- Rolladen EG WZ Tür links -->   <div data-hm-adress="00111A498BF95D"></div>
        <!-- Rolladen EG WZ Tür rechts -->   <div data-hm-adress="00111A498BF92D"></div>

        <!-- Licht Hausnummer -->   <div data-hm-adress="00089A4996736F"></div>

    </div>
    <div id="output">

    </div>
</body>

</html>