BIN = ./node_modules/.bin

# Source directories
SOURCES = lib/
TESTS = test/

# Output directories
DOCS = docs/
COVERAGE = coverage/

# Report files
LCOVFILE = coverage/lcov.info
DOCFILE = docs/index.html
LCOVHTML = coverage/lcov-report/index.html

# Build tools
JSHINT = $(BIN)/jshint
JSCS = $(BIN)/jscs
MOCHA = $(BIN)/mocha
_MOCHA = $(BIN)/_mocha
ISTANBUL = $(BIN)/istanbul
MR_DOC = $(BIN)/mr-doc
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
# Documentation
#========================================
docs:
	$(MR_DOC) -s $(SOURCES) -n "Passport-GitLab2" -o $(DOCS)

docs-view: docs
	open $(DOCFILE)

#========================================
# Clean
#========================================
clean-docs:
	rm -rf docs/

clean-coverage:
	rm -rf coverage/

clean: clean-coverage clean-docs

clobber: clean
	-rm -r node_modules

#========================================
# Global
#========================================
all: clean lint test coverage docs

.PHONY: lint test coverage docs clean clobber
