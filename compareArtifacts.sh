#!/bin/bash
#
# Compares the size of the built artifacts in Maven’s target and Gradle’s build directories.
# Copyright 2022 mstachowski

MAVEN=target/maven-to-gradle-0.0.1-SNAPSHOT.jar
GRADLE=build/libs/maven-to-gradle-0.0.1-SNAPSHOT.jar
ls -hl $MAVEN | awk '{print $9, $5}'
ls -hl $GRADLE | awk '{print $9, $5}'
