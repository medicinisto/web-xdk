# Contributing to the Layer Web XDK

Layer holds open source contributions to the same standards as code coming from our own team.  That does not mean we expect perfection, but is expected that anything left out of a PR (tests for example) be noted explicitly so that discussions can be had and anything missing from the PR can be completed before merging.

PRs must be submitted to the following branches:

* `dev-patch` branch for minor bug fixes
* `dev-minor` branch for added features

If your changes are not backwards compatable we may have you resubmit your PR to:

* `dev-major` branch for breaking changes (these may take a while before they get published)

PRs to `master` will not be accepted. PRs to incorrect branches will be rejected with instructions on what branch to submit it to.

Rationale: we will not QA and publish a release every time we approve a PR.  Any PR that is accepted
will be added to an existing patch, minor or major release and merged to master when we are ready to publish.

## Explaining the Problem

It is hard to accept a PR when we don't know what it is trying to fix. Getting Null Pointer Errors? Hard to tell from just reading your PR if your using the framework wrong to get those Null Pointer Errors or if you have found a valid bug.

If your submitting a bug fix:

1. Explain the problem that is being addressed
2. Explain what is required to replicate that error in detailed steps that very busy people can follow without lots of guesswork

If your running in strange environments (Atom for example) where different and unusual rules apply, you may want to find a way to let us see the app and environment instead of trying to step us through replicating your environment.

If we don't understand the problem being solved, we won't accept the PR.

If your adding a feature:

1. Explain the goal of the feature
2. If the feature is of interest to an insignificant number of our customers, we may review and propose a way to plug-in the desired feature and work with you to
update the PR so as to have a PR that supports the needed plug-in without this repository actually containing the plug-in
3. If the feature is of general use, but adds noticable build size, we may work with you to find a way to make it optional
4. Generally its good to convince us that a feature is of general use; please explain this clearly to us; your use case may be new and unfamiliar to us

## Code Style

All code must pass the style guide specified via the project's `.eslintrc` file.  Any PR that fails

```
grunt eslint:build
```

will be rejected.  Warnings are acceptable though.

## Testing

All tests must pass. Testing can be done using:

```
grunt develop
```

and then opening: `http://localhost:8004/test/ui_tests.html` and running through all tests on `ui_tests.html` and `core_tests.html` and landing successfully on `tests_done.html`.  If you have broken any tests, you may:

* Fix the tests
* Submit the PR and ask questions about whether those tests are significant

If they simply fail without any failures having been noted, the PR will be (you guessed it) rejected.

If your tests don't pass in Chrome or Firefox, your PR will be rejected. We will attempt to allocate time to investigate failures in Safari, IE11 and Edge browsers ourselves should tests be passing in Chrome and Firefox.

To insure IE11 support, avoid the following:

* `Object.assign()`
* `Object.values()`
* `new Set(initialValues)`

Which functions are not currently Polyfilled and do not work on IE11.  If these are seen in code, PRs will be (you guessed it) rejected.

### Creating Tests

Many fixes are one-liners. We may not always require new unit tests for your one liners.  However, do not be offended if we review the PR and insist that one or more tests be added.

If you are providing a bug fix that handles an edge case, please create a unit test for that edge case unless you want to see that edge case broken again... or want us to review your PR and then ask for your tests as an iteration. If your fix really is a one liner, less iteration is greatly appreciated.

If you are providing a feature, tests will be required.

## Submiting the PR

We suggest you use this template for submitting your PR:


**BUG FIX TEMPLATE:**

```
## Problem This Fixes

## Steps to replicate the problem

## Description of Changes

## Testing

### List browsers that all unit tests pass on

### Discuss tests not passing or not written
```

**FEATURE TEMPLATE:**

```
## Description of Feature

## Who is the feature useful for

## Description of Changes

## Testing

### Browsers that all unit tests pass on

### Discuss tests not passing or not written

```