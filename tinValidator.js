execute("0123456789");   // true
execute("1234567890");   // false
execute("12345678901");  // true
execute("1111111111");   // false
execute("12345abc678");  // false
execute("123456789");    // false (слишком короткая)