SHELL := /bin/bash

TEST := curl -s -o /dev/null -w "%{http_code}"
EXP := echo -n

test: test-basic test-register test-login


test-basic:

	# Test unknown route
	@diff <( $(EXP) 404 ) <( $(TEST) localhost:8080 )

test-register:

	# Invalid method and accept header
	@diff <( $(EXP) 405 ) <( $(TEST) localhost:8080/register )
	# Invalid accept header
	@diff <( $(EXP) 415 ) <( $(TEST) -XPOST localhost:8080/register )
	# Too large request
	@diff <( $(EXP) 413 ) <( $(TEST) -XPOST -d "$(shell seq -f '0' -s '' 1025 )" localhost:8080/register )
	# Invalid input
	@diff <( $(EXP) 400 ) <( $(TEST) -XPOST -d "username" localhost:8080/register )
	# Invalid username
	@diff <( $(EXP) 400 ) <( $(TEST) -XPOST -d "username" -d "password=secret" localhost:8080/register )
	# Successful register
	@diff <( $(EXP) 201 ) <( $(TEST) -XPOST -d "username=emilbayes" -d "password=secret" localhost:8080/register )
	# Username already taken
	@diff <( $(EXP) 409 ) <( $(TEST) -XPOST -d "username=emilbayes" -d "password=secret" localhost:8080/register )
	# test abort
	# test concurrency
	# test queueing


test-login:

	# Invalid method and accept header
	@diff <( $(EXP) 405 ) <( $(TEST) localhost:8080/login )
	# Invalid accept header
	@diff <( $(EXP) 415 ) <( $(TEST) -XPOST localhost:8080/login )
	# Too large request
	@diff <( $(EXP) 413 ) <( $(TEST) -XPOST -d "$(shell seq -f '0' -s '' 1025 )" localhost:8080/login )
	# Invalid input
	@diff <( $(EXP) 400 ) <( $(TEST) -XPOST -d "username" localhost:8080/login )
	# Invalid username
	@diff <( $(EXP) 400 ) <( $(TEST) -XPOST -d "username" -d "password=secret" localhost:8080/login )
	# Unknown user
	@diff <( $(EXP) 404 ) <( $(TEST) -XPOST -d "username=rando" -d "password=secret" localhost:8080/login )
	# Successful login
	@diff <( $(EXP) 204 ) <( $(TEST) -XPOST -d "username=emilbayes" -d "password=secret" localhost:8080/login )
	# test abort
	# test concurrency on rehash
	# test queueing
