#!/usr/bin/env node

const path = require( "path" );
const { run } = require( "haxec" );

const [ prog, ...args ] = process.argv.slice( 2 );

if ( !prog )
{
	console.error( "Usage: trace-unhandled prog [args...]" );
	console.error(
		"  <prog> can be either a shebang script or a JavaScript file"
	);
	process.exit( 1 );
}

run( path.join( __dirname, "register.js" ), [ prog, ...args ] );
