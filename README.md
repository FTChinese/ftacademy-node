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