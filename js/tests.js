QUnit.test( "hello test", function( assert ) {
    assert.ok( 1 == "1", "Passed!" );
});

QUnit.test( "aaa", function( assert ) {
    console.log(del_me());
    assert.ok( 1 == "1", "Passed!" );
});


