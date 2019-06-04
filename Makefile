cmd_prefix := ./node_modules/.bin
build_prod := build/production
scss_input := client/scss/main.scss
css_output := $(build_prod)/main.css

.PHONY: server sandbox js css inline deploy clean
server :
	nodemon index.js

sandbox :
	PORT=4200 NODE_ENV=sandbox URL_PREFIX=/sandbox DEBUG=fta* node index.js

js :
	$(cmd_prefix)/rollup -c

css :
	$(cmd_prefix)/node-sass --output-style=compressed --source-map=$(build_prod) $(scss_input) $(css_output)

inline : js css
	node ./util/inline.js

deploy :
	pm2 deploy ecosystem.config.js sandbox

pkg :
	pkg --out-path=build -d index.js

clean :
	rm -rf build/*
