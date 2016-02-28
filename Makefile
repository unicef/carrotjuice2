.PHONY: lint
lint:
	./node_modules/eslint/bin/eslint.js .

.PHONY: itest
itest:
	docker-compose build itest-majicbox-server itest-frontend itest
	docker-compose kill itest-frontend; docker-compose rm -f itest-frontend
	docker-compose run --rm itest

.PHONY: clean
clean:
	docker-compose kill; docker-compose rm -f
