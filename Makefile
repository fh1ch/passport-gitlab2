BIN = ./node_modules/.bin

# Source directories
TESTS = test/

# Report files
LCOVFILE = coverage/lcov.info
LCOVHTML = coverage/lcov-report/index.html

# Build tools
ESLINT = $(BIN)/eslint
MOCHA = $(BIN)/mocha
NYC = $(BIN)/nyc
COVERALLS = $(BIN)/coveralls

#========================================
# Linting
#========================================
lint:
	$(ESLINT) .

#========================================
# Test
#========================================
test:
	$(MOCHA) $(TESTS)

#========================================
# Coverage
#========================================
coverage:
	$(NYC) --reporter=lcov --reporter=text-summary $(MOCHA) $(TESTS)

coverage-report:
	cat $(LCOVFILE) | $(COVERALLS)

coverage-view: coverage
	open $(LCOVHTML)

#========================================
# Clean
#========================================
clean-coverage:
	rm -rf coverage/

clean: clean-coverage

clobber: clean
	-rm -r node_modules

#========================================
# Global
#========================================
all: clean lint test coverage

.PHONY: lint test coverage clean clobber
