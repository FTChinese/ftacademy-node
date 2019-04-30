## TODO

* Cache promotion plans.
* Build to flat binary.

## Sitemap

* `GET /` Home page
* `GET /subscription` Show paywall.
* `GET /sbuscription/<standard|premium>/<year|month>` Show payment page
* `POST /sbuscription/<standard|premium>/<year|month>` Submit data to api.

## Deploy with PM2

To deploy a node app with PM2, you need take two steps:

1. Initialize the remote folder as specified in `path`:

```
pm2 deploy ecosystem.config.js <app_name> setup
```

2. Deploy Code:

```
pm2 deploy ecosystemconfig.js <app_name>
```

## Pitfall on Wechat Response

In the second step of OAuth to exchagne code for access token, wechat documentations said the response is JSON. In fact it is not. Look at their response header:

```
Connection: keep-alive
Content-Length: 338
Content-Type: text/plain
Date: Sat, 20 Apr 2019 04:06:00 GMT
```

SuperAgent won't parse it as JSON. Manually parse it. Never believe they can do anything in standard way.
