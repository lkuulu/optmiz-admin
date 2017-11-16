<?php

namespace STHCommon\Hooks;

use Silex\Application;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Firebase\JWT\JWT;
use WyriHaximus\SliFly\FlysystemServiceProvider;
use Symfony\Component\HttpFoundation\RedirectResponse;

class JwtHook
{
    CONST ROOT = '/var/www/optmiz/image/files/';

    protected $data;

    public function getData()
    {
        return $this->data;
    }

    public function __invoke(Request $request, Application $app)
    {

        if ($request->getMethod() == 'OPTIONS') {
            return true;
        }

//        {
//            "alg": "HS256",
//              "typ": "JWT"
//        }
//        {
//            "repository": "repository",
//              "name": "lkuulu",
//              "admin": true
//        }

        $requestHeaders = $request->headers;
        $cookies = $request->cookies;
        if ($requestHeaders->has("Authorization")) {
            $bearer = $requestHeaders->get('Authorization');
        } else if ($cookies->has("Authorization")) {
            $bearer = $cookies->get('Authorization');
        }

        if (!isset($bearer)) {
            return new RedirectResponse('/login', 302, []);
        } else {
            $bearers = explode(' ', $bearer);
            if (isset($bearers[1])) {
                $data = JWT::decode($bearers[1], $app["jwt.secret"], array('HS256'));
                $app['jwt.user'] = $data;
                $app['repository'] = SELF::ROOT . $data->repository;
            }
        }
    }
}
