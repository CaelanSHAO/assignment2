#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Assignment2Stack } from '../lib/assignment2-stack';

const app = new cdk.App();
new Assignment2Stack(app, 'Assignment2Stack'); 