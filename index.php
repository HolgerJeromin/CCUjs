<html>

<head>
    <meta charset="utf8">
    <meta name="viewport" content="width=device-width">
    <title>Homematic tool</title>
    <link rel="preload" href="//ccu3-wz/addons/xmlapi/devicelist.cgi" as="fetch" crossorigin>
    <script src="runtime.js<?php if($_GET['force']) echo "?random=".rand(); ?>" async defer></script>
    <style>
        #actors {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(70px, auto));
        }

        [data-hm-adress] {
            display: flex;
            flex-direction: column;
            margin: 0.5em;
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
    <h1>Haferkamp 16 Steuerung</h1>
    <div id="actors">
        <div data-hm-adress="00111A498BF963"></div><!-- Roll Laura -->
        <div data-hm-adress="00111A498BF94A"></div><!-- Roll Vera -->
        <div data-hm-adress="00111A498BF801"></div><!-- Roll SZ -->
        <div data-hm-adress="00111A498BF95C"></div><!-- Roll AZ -->

        <div data-hm-adress="0001D3C99C916E"></div><!-- Licht AZ -->
        <div data-hm-adress="001F98A9AABDDD"></div><!-- CCU3 -->

        <div data-hm-adress="00085A49901A88"></div><!-- Licht Laura -->
        <div data-hm-adress="00085A49901C43"></div><!-- Licht Vera -->

        <div data-hm-adress="00085A49901C69"></div><!-- Licht aussen -->
    </div>
    <div id="output">

    </div>
</body>

</html>