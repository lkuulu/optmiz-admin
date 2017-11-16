<?php

require_once __DIR__.'/../vendor/autoload.php';

use STHCommon\Hooks\JwtHook;
use Symfony\Component\HttpFoundation\RedirectResponse;

$app = new Silex\Application(['debug' => true]);

$app->register(new Silex\Provider\TwigServiceProvider(), array(
    'twig.path' => __DIR__.'/../app/Resources/views',
));

//var_dump(__DIR__.'/views');

$app->register(new Silex\Provider\AssetServiceProvider(), array(
    'assets.version' => 'v1',
    'assets.version_format' => '%s?version=%s',
    'assets.named_packages' => array(
        'css' => array('version' => 's1', 'base_path' => 'assets/styles'),
        'vendor' => array('version' => 's1', 'base_path' => 'assets/vendor'),
        'vendor-modif' => array('version' => 's1', 'base_path' => 'assets/vendor-modif'),
        'script' => array('version' => 's1', 'base_path' => 'assets/scripts'),
        'image' => array('version' => 's1', 'base_path' => 'assets/img'),
        'font' => array('version' => 's1', 'base_path' => 'assets/fonts'),
    ),
));

$app["jwt.secret"] = 'my key is secret';

$app->get('/', function () use ($app) {
    return $app['twig']->render('admin.twig', array());
}); //->before(new JwtHook);

$app->get('/login-redirect', function() use ($app) {
    $getParams = $app['request_stack']->getCurrentRequest()->request->all();
    return new RedirectResponse('/', 302, ['Authorization'=>'Bearer '.$getParams['bearer']]);
});

$app->get('/login', function ()  use ($app) {
    return $app['twig']->render('login.twig', array());
});

$app->get('/logout', function ()  use ($app){
    $response = new RedirectResponse('/login', 302, []);
    $response->headers->clearCookie('Authorization');
    return $response;
});

$app->get('/suscribe', function ()  use ($app){
    return $app['twig']->render('suscribe.twig', array());
});



$app->get('/hello/{name}', function ($name) use ($app) {
    return $app['twig']->render('hello.twig', array(
        'name' => $name,
    ));
});

$app->run();
