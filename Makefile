BIN = ./node_modules/.bin

# Source directories
SOURCES = lib/
TESTS = test/

# Output directories
COVERAGE = coverage/

# Report files
LCOVFILE = coverage/lcov.info
LCOVHTML = coverage/lcov-report/index.html

# Build tools
JSHINT = $(BIN)/jshint
JSCS = $(BIN)/jscs
MOCHA = $(BIN)/mocha
_MOCHA = $(BIN)/_mocha
ISTANBUL = $(BIN)/istanbul
COVERALLS = $(BIN)/coveralls

#========================================
# Linting
#========================================
lint_jshint:
	$(JSHINT) $(SOURCES) $(TESTS)

lint_jscs:
	$(JSCS) $(SOURCES) $(TESTS)

lint: lint_jshint lint_jscs

#========================================
# Test
#========================================
test:
	$(MOCHA) $(TESTS)

#========================================
# Coverage
#========================================
coverage:
	$(ISTANBUL) cover --dir $(COVERAGE) $(_MOCHA) -- $(TESTS)

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
