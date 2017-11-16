<?php

require_once __DIR__.'/../vendor/autoload.php';

$app = new Silex\Application();

$app->register(new Silex\Provider\TwigServiceProvider(), array(
    'twig.path' => __DIR__.'/views',
));

//var_dump(__DIR__.'/views');

$app->register(new Silex\Provider\AssetServiceProvider(), array(
    'assets.version' => 'v1',
    'assets.version_format' => '%s?version=%s',
    'assets.named_packages' => array(
        'css' => array('version' => 'css2', 'base_path' => '/whatever-makes-sense'),
        'images' => array('base_urls' => array('https://img.example.com')),
    ),
));

$app->get('/', function () {
    return 'Hello world';
});

$app->get('/hello/{name}', function ($name) use ($app) {
 // var_dump($name);
    return $app['twig']->render('hello.twig', array(
        'name' => $name,
    ));
//    return 'Hello ' . $app->escape($name);
});

$app->run();
