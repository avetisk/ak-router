JS = $$(find index.js ./lib ./test/index.js -name "*.js")

test: validate buildtest
	@./node_modules/karma/bin/karma start

clean:
	@rm -f ./test/build.js
	@rm -fr ./node_modules
	@rm -fr ./lib-cov

buildtest:
	@./node_modules/.bin/browserify -d ./test/index.js > ./test/build.js

validate:
	@jshint --config .jshintrc $(JS)

coverage:
	@rm -fr ./lib-cov
	@./node_modules/.bin/istanbul instrument -o ./lib-cov ./lib
	@AK_ROUTER_TEST_COVERAGE=1 ./node_modules/.bin/browserify -d ./test/index.js -t envify > ./test/build.js
	@AK_ROUTER_TEST_COVERAGE=1 ./node_modules/karma/bin/karma start karma-coverage.conf.js --browsers Chrome
	@AK_ROUTER_TEST_COVERAGE=1 ./node_modules/karma/bin/karma start karma-coverage.conf.js --browsers Firefox
	@AK_ROUTER_TEST_COVERAGE=1 ./node_modules/karma/bin/karma start karma-coverage.conf.js --browsers Safari

.PHONY: clean buildtest test validate coverage
