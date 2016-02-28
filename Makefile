.PHONY: lint
lint:
	./node_modules/eslint/bin/eslint.js .

# Runs integration tests. This does an amount of cleanup, so it should be
# testing the latest code each time. You can always run `make clean` if
# you're not sure though.
#
# NOTE: If you're running this on OS X, eval $(docker-machine env default) first.
.PHONY: itest
itest:
	# Builds all of the relevant containers. If this is taking too much time and we're running
	# integration tests as part of the development cycle, we can use volume mounts to speed it
	# up.
	docker-compose build itest-majicbox-server itest-frontend itest

	# Removes some old containers, so they are forced to relaunch with the new containers above.
	docker-compose kill itest-frontend; docker-compose rm -f itest-frontend

	# Runs integration tests.
	docker-compose run --rm itest

.PHONY: clean
clean:
	docker-compose kill; docker-compose rm -f
