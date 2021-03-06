///<reference path="Assert.ts"/>
///<reference path="../src/SqlContext.ts"/>
console.log('----- unit tests for DML -----');
Assert.runCase('insert', function () {
    var ctx = new SqlContext();
    var parser = new SqlParser("create table t_gender(id number,name varchar)");
    var node = parser.parseCreateTableNode(null);
    Assert.isTrue(node instanceof SqlCreateTableNode);
    node.compute(ctx);
    var database = ctx.database;
    var table = database.tables['t_gender'];
    var affectRowCount = database.execute("insert into t_gender(id, name) values(1, 'Male')");
    Assert.isEqual(affectRowCount, 1);
    Assert.isEqual(table.rows.length, 1);
    affectRowCount = database.execute("insert into t_gender(id, name) values(?, ?)", [2, 'Female']);
    Assert.isEqual(affectRowCount, 1);
    Assert.isEqual(table.rows.length, 2);
    //table.print();
});
Assert.runCase('delete', function () {
    var ctx = new SqlContext();
    var parser = new SqlParser("create table t_gender(id number,name varchar)");
    var node = parser.parseCreateTableNode(null);
    Assert.isTrue(node instanceof SqlCreateTableNode);
    node.compute(ctx);
    var database = ctx.database;
    var table = database.tables['t_gender'];
    table.addRow([1, 'Male']);
    table.addRow([2, 'Female']);
    var affectRowCount = database.execute('delete from t_gender where id=1');
    Assert.isEqual(affectRowCount, 1);
    Assert.isEqual(table.rows.length, 1);
    Assert.isEqual(table.rows[0].values, [2, 'Female']);
    affectRowCount = database.execute('delete from t_gender');
    Assert.isEqual(affectRowCount, 1);
    Assert.isEqual(table.rows.length, 0);
    //table.print();
});
Assert.runCase('update', function () {
    var ctx = new SqlContext();
    var parser = new SqlParser("create table t_gender(id number,name varchar)");
    var node = parser.parseCreateTableNode(null);
    Assert.isTrue(node instanceof SqlCreateTableNode);
    node.compute(ctx);
    var database = ctx.database;
    var table = database.tables['t_gender'];
    table.addRow([1, 'Male']);
    table.addRow([2, 'Female']);
    var affectRowCount = database.execute("update t_gender set name='ABC'");
    Assert.isEqual(affectRowCount, 2);
    Assert.isEqual(table.rows.length, 2);
    Assert.isEqual(table.rows[0].values, [1, 'ABC']);
    Assert.isEqual(table.rows[1].values, [2, 'ABC']);
    affectRowCount = database.execute("update t_gender set name='男' where id=1");
    Assert.isEqual(affectRowCount, 1);
    Assert.isEqual(table.rows[0].values, [1, '男']);
    affectRowCount = database.execute("update t_gender t set t.name='女' where t.id=?", [2]);
    Assert.isEqual(affectRowCount, 1);
    Assert.isEqual(table.rows[1].values, [2, '女']);
    //table.print();
});
function createDemoDatabase() {
    var ctx = new SqlContext();
    var database = ctx.database;
    database.execute("create table t_gender(id number, name varchar)");
    database.execute("create table t_dept(dept_id number, dept_name varchar)");
    database.execute("create table t_staff(id varchar, name varchar, gender number, dept_id number)");
    database.execute("create table t_dept2(dept_id number, dept_name varchar)");
    var table1 = database.tables['t_gender'];
    table1.addRow([1, 'Male']);
    table1.addRow([2, 'Female']);
    var table2 = database.tables['t_dept'];
    table2.addRow([101, 'Tech']);
    table2.addRow([102, 'Finance']);
    var table3 = database.tables['t_staff'];
    table3.addRow(['016001', 'Jack', 1, 102]);
    table3.addRow(['016002', 'Bruce', 1, null]);
    table3.addRow(['016003', 'Alan', null, 101]);
    table3.addRow(['016004', 'Hellen', 2, 103]);
    table3.addRow(['016005', 'Linda', 2, 101]);
    table3.addRow(['016006', 'Royal', 3, 104]);
    var table4 = database.tables['t_dept2'];
    table4.addRow([101, 'Tech']);
    table4.addRow([101, 'Tech2']);
    table4.addRow([102, 'Finance']);
    return database;
}
Assert.runCase('select join', function () {
    var database = createDemoDatabase();
    var result = database.execute("\n        SELECT\n            s.id,\n            s.name,\n            s.gender AS gender_id,\n            s.dept_id,\n            g.name AS gender_name,\n            d.dept_name\n        FROM t_staff s\n        LEFT JOIN t_gender g ON g.id=s.gender\n        LEFT JOIN t_dept d ON d.dept_id=s.dept_id\n        ");
    Assert.isTrue(result instanceof SqlDataTable);
    if (result instanceof SqlDataTable) {
        Assert.isEqual(result.rows.length, 6);
        Assert.isEqual(result.rows[0].values, ['016001', 'Jack', 1, 102, 'Male', 'Finance']);
        Assert.isEqual(result.rows[1].values, ['016002', 'Bruce', 1, null, 'Male', null]);
        Assert.isEqual(result.rows[2].values, ['016003', 'Alan', null, 101, null, 'Tech']);
        Assert.isEqual(result.rows[3].values, ['016004', 'Hellen', 2, 103, 'Female', null]);
        Assert.isEqual(result.rows[4].values, ['016005', 'Linda', 2, 101, 'Female', 'Tech']);
        Assert.isEqual(result.rows[5].values, ['016006', 'Royal', 3, 104, null, null]);
        //result.print();
    }
    result = database.execute("\n        SELECT\n            s.id,\n            s.name,\n            s.gender AS gender_id,\n            s.dept_id,\n            g.name AS gender_name,\n            d.dept_name\n        FROM t_staff s\n        JOIN t_gender g ON g.id=s.gender\n        LEFT JOIN t_dept d ON d.dept_id=s.dept_id\n        ");
    Assert.isTrue(result instanceof SqlDataTable);
    if (result instanceof SqlDataTable) {
        Assert.isEqual(result.rows.length, 4);
        Assert.isEqual(result.rows[0].values, ['016001', 'Jack', 1, 102, 'Male', 'Finance']);
        Assert.isEqual(result.rows[1].values, ['016002', 'Bruce', 1, null, 'Male', null]);
        Assert.isEqual(result.rows[2].values, ['016004', 'Hellen', 2, 103, 'Female', null]);
        Assert.isEqual(result.rows[3].values, ['016005', 'Linda', 2, 101, 'Female', 'Tech']);
        //result.print();
    }
    result = database.execute("\n        SELECT\n            s.id,\n            s.name,\n            s.gender AS gender_id,\n            s.dept_id,\n            g.name AS gender_name,\n            d.dept_name\n        FROM t_staff s\n        LEFT JOIN t_gender g ON g.id=s.gender\n        JOIN t_dept d ON d.dept_id=s.dept_id\n        ");
    Assert.isTrue(result instanceof SqlDataTable);
    if (result instanceof SqlDataTable) {
        Assert.isEqual(result.rows.length, 3);
        Assert.isEqual(result.rows[0].values, ['016001', 'Jack', 1, 102, 'Male', 'Finance']);
        Assert.isEqual(result.rows[1].values, ['016003', 'Alan', null, 101, null, 'Tech']);
        Assert.isEqual(result.rows[2].values, ['016005', 'Linda', 2, 101, 'Female', 'Tech']);
        //result.print();
    }
    result = database.execute("\n        SELECT\n            s.id,\n            s.name,\n            s.gender AS gender_id,\n            s.dept_id,\n            g.name AS gender_name,\n            d.dept_name\n        FROM t_staff s\n        JOIN t_gender g ON g.id=s.gender\n        JOIN t_dept d ON d.dept_id=s.dept_id\n        ");
    Assert.isTrue(result instanceof SqlDataTable);
    if (result instanceof SqlDataTable) {
        Assert.isEqual(result.rows.length, 2);
        Assert.isEqual(result.rows[0].values, ['016001', 'Jack', 1, 102, 'Male', 'Finance']);
        Assert.isEqual(result.rows[1].values, ['016005', 'Linda', 2, 101, 'Female', 'Tech']);
        //result.print();
    }
    result = database.execute("\n        SELECT\n            s.id,\n            s.name,\n            s.dept_id,\n            d.dept_name\n        FROM t_staff s\n        JOIN t_dept2 d ON d.dept_id=s.dept_id\n        ");
    Assert.isTrue(result instanceof SqlDataTable);
    if (result instanceof SqlDataTable) {
        Assert.isEqual(result.rows.length, 5);
        Assert.isEqual(result.rows[0].values, ['016001', 'Jack', 102, 'Finance']);
        Assert.isEqual(result.rows[1].values, ['016003', 'Alan', 101, 'Tech']);
        Assert.isEqual(result.rows[2].values, ['016003', 'Alan', 101, 'Tech2']);
        Assert.isEqual(result.rows[3].values, ['016005', 'Linda', 101, 'Tech']);
        Assert.isEqual(result.rows[4].values, ['016005', 'Linda', 101, 'Tech2']);
        //result.print();
    }
});
Assert.runCase('select where', function () {
    var database = createDemoDatabase();
    var result = database.execute("\n        SELECT\n            s.id,\n            s.name,\n            s.gender AS gender_id,\n            s.dept_id,\n            g.name AS gender_name,\n            d.dept_name\n        FROM t_staff s\n        LEFT JOIN t_gender g ON g.id=s.gender\n        LEFT JOIN t_dept d ON d.dept_id=s.dept_id\n        WHERE gender = 2\n        ");
    Assert.isTrue(result instanceof SqlDataTable);
    if (result instanceof SqlDataTable) {
        Assert.isEqual(result.rows.length, 2);
        Assert.isEqual(result.rows[0].values, ['016004', 'Hellen', 2, 103, 'Female', null]);
        Assert.isEqual(result.rows[1].values, ['016005', 'Linda', 2, 101, 'Female', 'Tech']);
        //result.print();
    }
    result = database.execute("\n        SELECT\n            s.id,\n            s.name,\n            s.gender AS gender_id,\n            s.dept_id,\n            g.name AS gender_name,\n            d.dept_name\n        FROM t_staff s\n        LEFT JOIN t_gender g ON g.id=s.gender\n        LEFT JOIN t_dept d ON d.dept_id=s.dept_id\n        WHERE gender BETWEEN 1 AND 2\n        ");
    Assert.isTrue(result instanceof SqlDataTable);
    if (result instanceof SqlDataTable) {
        Assert.isEqual(result.rows.length, 4);
        Assert.isEqual(result.rows[0].values, ['016001', 'Jack', 1, 102, 'Male', 'Finance']);
        Assert.isEqual(result.rows[1].values, ['016002', 'Bruce', 1, null, 'Male', null]);
        Assert.isEqual(result.rows[2].values, ['016004', 'Hellen', 2, 103, 'Female', null]);
        Assert.isEqual(result.rows[3].values, ['016005', 'Linda', 2, 101, 'Female', 'Tech']);
        //result.print();
    }
    result = database.execute("\n        SELECT\n            s.id,\n            s.name,\n            s.gender AS gender_id,\n            s.dept_id,\n            g.name AS gender_name,\n            d.dept_name\n        FROM t_staff s\n        LEFT JOIN t_gender g ON g.id=s.gender\n        LEFT JOIN t_dept d ON d.dept_id=s.dept_id\n        WHERE gender IN (1, 2)\n        ");
    Assert.isTrue(result instanceof SqlDataTable);
    if (result instanceof SqlDataTable) {
        Assert.isEqual(result.rows.length, 4);
        Assert.isEqual(result.rows[0].values, ['016001', 'Jack', 1, 102, 'Male', 'Finance']);
        Assert.isEqual(result.rows[1].values, ['016002', 'Bruce', 1, null, 'Male', null]);
        Assert.isEqual(result.rows[2].values, ['016004', 'Hellen', 2, 103, 'Female', null]);
        Assert.isEqual(result.rows[3].values, ['016005', 'Linda', 2, 101, 'Female', 'Tech']);
        //result.print();
    }
    result = database.execute("\n        SELECT\n            s.id,\n            s.name,\n            s.gender AS gender_id,\n            s.dept_id,\n            g.name AS gender_name,\n            d.dept_name\n        FROM t_staff s\n        LEFT JOIN t_gender g ON g.id=s.gender\n        LEFT JOIN t_dept d ON d.dept_id=s.dept_id\n        WHERE gender IN ('1', '2')\n        ");
    Assert.isTrue(result instanceof SqlDataTable);
    if (result instanceof SqlDataTable) {
        Assert.isEqual(result.rows.length, 4);
        Assert.isEqual(result.rows[0].values, ['016001', 'Jack', 1, 102, 'Male', 'Finance']);
        Assert.isEqual(result.rows[1].values, ['016002', 'Bruce', 1, null, 'Male', null]);
        Assert.isEqual(result.rows[2].values, ['016004', 'Hellen', 2, 103, 'Female', null]);
        Assert.isEqual(result.rows[3].values, ['016005', 'Linda', 2, 101, 'Female', 'Tech']);
        //result.print();
    }
    result = database.execute("\n        SELECT\n            s.id,\n            s.name,\n            s.gender AS gender_id,\n            s.dept_id,\n            g.name AS gender_name,\n            d.dept_name\n        FROM t_staff s\n        LEFT JOIN t_gender g ON g.id=s.gender\n        LEFT JOIN t_dept d ON d.dept_id=s.dept_id\n        WHERE g.name IS NULL\n        ");
    Assert.isTrue(result instanceof SqlDataTable);
    if (result instanceof SqlDataTable) {
        Assert.isEqual(result.rows.length, 2);
        Assert.isEqual(result.rows[0].values, ['016003', 'Alan', null, 101, null, 'Tech']);
        Assert.isEqual(result.rows[1].values, ['016006', 'Royal', 3, 104, null, null]);
        //result.print();
    }
    result = database.execute("\n        SELECT\n            s.id,\n            s.name,\n            s.gender AS gender_id,\n            s.dept_id,\n            g.name AS gender_name,\n            d.dept_name\n        FROM t_staff s\n        LEFT JOIN t_gender g ON g.id=s.gender\n        LEFT JOIN t_dept d ON d.dept_id=s.dept_id\n        WHERE g.name IS NULL AND d.dept_name IS NOT NULL\n        ");
    Assert.isTrue(result instanceof SqlDataTable);
    if (result instanceof SqlDataTable) {
        Assert.isEqual(result.rows.length, 1);
        Assert.isEqual(result.rows[0].values, ['016003', 'Alan', null, 101, null, 'Tech']);
        //result.print();
    }
    result = database.execute("\n        SELECT\n            s.id,\n            s.name,\n            s.gender AS gender_id,\n            s.dept_id,\n            g.name AS gender_name,\n            d.dept_name\n        FROM t_staff s\n        LEFT JOIN t_gender g ON g.id=s.gender\n        LEFT JOIN t_dept d ON d.dept_id=s.dept_id\n        WHERE g.name IS NULL OR d.dept_name IS NULL\n        ");
    Assert.isTrue(result instanceof SqlDataTable);
    if (result instanceof SqlDataTable) {
        Assert.isEqual(result.rows.length, 4);
        Assert.isEqual(result.rows[0].values, ['016002', 'Bruce', 1, null, 'Male', null]);
        Assert.isEqual(result.rows[1].values, ['016003', 'Alan', null, 101, null, 'Tech']);
        Assert.isEqual(result.rows[2].values, ['016004', 'Hellen', 2, 103, 'Female', null]);
        Assert.isEqual(result.rows[3].values, ['016006', 'Royal', 3, 104, null, null]);
        //result.print();
    }
    result = database.execute("\n        SELECT\n            s.id,\n            s.name,\n            s.gender AS gender_id,\n            s.dept_id,\n            g.name AS gender_name,\n            d.dept_name\n        FROM t_staff s\n        LEFT JOIN t_gender g ON g.id=s.gender\n        LEFT JOIN t_dept d ON d.dept_id=s.dept_id\n        WHERE s.name LIKE '%e%'\n        ");
    Assert.isTrue(result instanceof SqlDataTable);
    if (result instanceof SqlDataTable) {
        Assert.isEqual(result.rows.length, 2);
        Assert.isEqual(result.rows[0].values, ['016002', 'Bruce', 1, null, 'Male', null]);
        Assert.isEqual(result.rows[1].values, ['016004', 'Hellen', 2, 103, 'Female', null]);
        //result.print();
    }
});
Assert.runCase('select fields', function () {
    var database = createDemoDatabase();
    var result = database.execute('SELECT * FROM t_staff');
    Assert.isTrue(result instanceof SqlDataTable);
    if (result instanceof SqlDataTable) {
        Assert.isEqual(result.rows.length, 6);
        Assert.isEqual(result.rows[0].values, ['016001', 'Jack', 1, 102]);
        Assert.isEqual(result.rows[1].values, ['016002', 'Bruce', 1, null]);
        Assert.isEqual(result.rows[2].values, ['016003', 'Alan', null, 101]);
        Assert.isEqual(result.rows[3].values, ['016004', 'Hellen', 2, 103]);
        Assert.isEqual(result.rows[4].values, ['016005', 'Linda', 2, 101]);
        Assert.isEqual(result.rows[5].values, ['016006', 'Royal', 3, 104]);
        //result.print();
    }
    result = database.execute('SELECT t.* FROM t_staff t');
    Assert.isTrue(result instanceof SqlDataTable);
    if (result instanceof SqlDataTable) {
        Assert.isEqual(result.rows.length, 6);
        Assert.isEqual(result.rows[0].values, ['016001', 'Jack', 1, 102]);
        Assert.isEqual(result.rows[1].values, ['016002', 'Bruce', 1, null]);
        Assert.isEqual(result.rows[2].values, ['016003', 'Alan', null, 101]);
        Assert.isEqual(result.rows[3].values, ['016004', 'Hellen', 2, 103]);
        Assert.isEqual(result.rows[4].values, ['016005', 'Linda', 2, 101]);
        Assert.isEqual(result.rows[5].values, ['016006', 'Royal', 3, 104]);
        //result.print();
    }
    result = database.execute('SELECT substr(id, 5) as seq, id, name, 1 as flag FROM t_staff');
    Assert.isTrue(result instanceof SqlDataTable);
    if (result instanceof SqlDataTable) {
        Assert.isEqual(result.rows.length, 6);
        Assert.isEqual(result.rows[0].values, ['1', '016001', 'Jack', 1]);
        Assert.isEqual(result.rows[1].values, ['2', '016002', 'Bruce', 1]);
        Assert.isEqual(result.rows[2].values, ['3', '016003', 'Alan', 1]);
        Assert.isEqual(result.rows[3].values, ['4', '016004', 'Hellen', 1]);
        Assert.isEqual(result.rows[4].values, ['5', '016005', 'Linda', 1]);
        Assert.isEqual(result.rows[5].values, ['6', '016006', 'Royal', 1]);
        //result.print();
    }
});
Assert.runCase('select group by', function () {
    var database = createDemoDatabase();
    var result = database.execute("SELECT t.gender, count(*) FROM t_staff t GROUP BY t.gender");
    Assert.isTrue(result instanceof SqlDataTable);
    if (result instanceof SqlDataTable) {
        Assert.isEqual(result.rows.length, 4);
        Assert.isEqual(result.rows[0].values, [1, 2]);
        Assert.isEqual(result.rows[1].values, [null, 1]);
        Assert.isEqual(result.rows[2].values, [2, 2]);
        Assert.isEqual(result.rows[3].values, [3, 1]);
    }
    result = database.execute("SELECT t.gender, count(*) FROM t_staff t WHERE t.gender IS NOT NULL GROUP BY t.gender");
    Assert.isTrue(result instanceof SqlDataTable);
    if (result instanceof SqlDataTable) {
        Assert.isEqual(result.rows.length, 3);
        Assert.isEqual(result.rows[0].values, [1, 2]);
        Assert.isEqual(result.rows[1].values, [2, 2]);
        Assert.isEqual(result.rows[2].values, [3, 1]);
    }
    result = database.execute("SELECT count(*), t.gender FROM t_staff t GROUP BY t.gender");
    Assert.isTrue(result instanceof SqlDataTable);
    if (result instanceof SqlDataTable) {
        Assert.isEqual(result.rows.length, 4);
        Assert.isEqual(result.rows[0].values, [2, 1]);
        Assert.isEqual(result.rows[1].values, [1, null]);
        Assert.isEqual(result.rows[2].values, [2, 2]);
        Assert.isEqual(result.rows[3].values, [1, 3]);
    }
    result = database.execute("SELECT count(*) FROM t_staff t GROUP BY t.gender");
    Assert.isTrue(result instanceof SqlDataTable);
    if (result instanceof SqlDataTable) {
        Assert.isEqual(result.rows.length, 4);
        Assert.isEqual(result.rows[0].values, [2]);
        Assert.isEqual(result.rows[1].values, [1]);
        Assert.isEqual(result.rows[2].values, [2]);
        Assert.isEqual(result.rows[3].values, [1]);
    }
    result = database.execute("SELECT t.gender, count(*) * 10 FROM t_staff t GROUP BY t.gender");
    Assert.isTrue(result instanceof SqlDataTable);
    if (result instanceof SqlDataTable) {
        Assert.isEqual(result.rows.length, 4);
        Assert.isEqual(result.rows[0].values, [1, 20]);
        Assert.isEqual(result.rows[1].values, [null, 10]);
        Assert.isEqual(result.rows[2].values, [2, 20]);
        Assert.isEqual(result.rows[3].values, [3, 10]);
    }
    result = database.execute("SELECT t.gender, t.dept_id, COUNT(1) FROM t_staff t GROUP BY t.gender, t.dept_id");
    Assert.isTrue(result instanceof SqlDataTable);
    if (result instanceof SqlDataTable) {
        Assert.isEqual(result.rows.length, 6);
        Assert.isEqual(result.rows[0].values, [1, 102, 1]);
        Assert.isEqual(result.rows[1].values, [1, null, 1]);
        Assert.isEqual(result.rows[2].values, [null, 101, 1]);
        Assert.isEqual(result.rows[3].values, [2, 103, 1]);
        Assert.isEqual(result.rows[4].values, [2, 101, 1]);
        Assert.isEqual(result.rows[5].values, [3, 104, 1]);
    }
    result = database.execute("SELECT count(t.dept_id), max(dept_id) FROM t_staff t");
    Assert.isTrue(result instanceof SqlDataTable);
    if (result instanceof SqlDataTable) {
        Assert.isEqual(result.rows.length, 1);
        Assert.isEqual(result.rows[0].values, [5, 104]);
    }
    result = database.execute("SELECT (CASE gender WHEN 1 THEN '男' WHEN 2 THEN '女' END) AS gender, COUNT(*) FROM t_staff GROUP BY (CASE gender WHEN 1 THEN '男' WHEN 2 THEN '女' END)");
    Assert.isTrue(result instanceof SqlDataTable);
    if (result instanceof SqlDataTable) {
        Assert.isEqual(result.rows.length, 3);
        Assert.isEqual(result.rows.length, 3);
        Assert.isEqual(result.rows[0].values, ['男', 2]);
        Assert.isEqual(result.rows[1].values, [null, 2]);
        Assert.isEqual(result.rows[2].values, ['女', 2]);
    }
    result = database.execute("SELECT (CASE WHEN gender = 1 THEN '男' WHEN gender = 2 THEN '女' END) AS gender, COUNT(*) FROM t_staff GROUP BY (CASE gender WHEN 1 THEN '男' WHEN 2 THEN '女' END)");
    Assert.isTrue(result instanceof SqlDataTable);
    if (result instanceof SqlDataTable) {
        Assert.isEqual(result.rows.length, 3);
        Assert.isEqual(result.rows.length, 3);
        Assert.isEqual(result.rows[0].values, ['男', 2]);
        Assert.isEqual(result.rows[1].values, [null, 2]);
        Assert.isEqual(result.rows[2].values, ['女', 2]);
    }
});
Assert.runCase('select having', function () {
    var database = createDemoDatabase();
    var result = database.execute("SELECT t.gender, count(*) FROM t_staff t GROUP BY t.gender HAVING COUNT(*) > 1");
    Assert.isTrue(result instanceof SqlDataTable);
    if (result instanceof SqlDataTable) {
        Assert.isEqual(result.rows.length, 2);
        Assert.isEqual(result.rows[0].values, [1, 2]);
        Assert.isEqual(result.rows[1].values, [2, 2]);
    }
});
Assert.runCase('select order by', function () {
    var database = createDemoDatabase();
    var result = database.execute("SELECT s.id, s.name FROM t_staff s ORDER BY s.id DESC");
    Assert.isTrue(result instanceof SqlDataTable);
    if (result instanceof SqlDataTable) {
        Assert.isEqual(result.rows.length, 6);
        Assert.isEqual(result.rows[0].values, ['016006', 'Royal']);
        Assert.isEqual(result.rows[1].values, ['016005', 'Linda']);
        Assert.isEqual(result.rows[2].values, ['016004', 'Hellen']);
        Assert.isEqual(result.rows[3].values, ['016003', 'Alan']);
        Assert.isEqual(result.rows[4].values, ['016002', 'Bruce']);
        Assert.isEqual(result.rows[5].values, ['016001', 'Jack']);
    }
    result = database.execute("SELECT s.id, s.name, s.gender FROM t_staff s ORDER BY s.gender DESC, s.id");
    Assert.isTrue(result instanceof SqlDataTable);
    if (result instanceof SqlDataTable) {
        Assert.isEqual(result.rows.length, 6);
        Assert.isEqual(result.rows[0].values, ['016006', 'Royal', 3]);
        Assert.isEqual(result.rows[1].values, ['016004', 'Hellen', 2]);
        Assert.isEqual(result.rows[2].values, ['016005', 'Linda', 2]);
        Assert.isEqual(result.rows[3].values, ['016001', 'Jack', 1]);
        Assert.isEqual(result.rows[4].values, ['016002', 'Bruce', 1]);
        Assert.isEqual(result.rows[5].values, ['016003', 'Alan', null]);
    }
    result = database.execute("SELECT s.id, s.name, s.gender FROM t_staff s ORDER BY s.gender DESC");
    Assert.isTrue(result instanceof SqlDataTable);
    if (result instanceof SqlDataTable) {
        Assert.isEqual(result.rows.length, 6);
        Assert.isEqual(result.rows[0].values, ['016006', 'Royal', 3]);
        Assert.isEqual(result.rows[1].values, ['016004', 'Hellen', 2]);
        Assert.isEqual(result.rows[2].values, ['016005', 'Linda', 2]);
        Assert.isEqual(result.rows[3].values, ['016001', 'Jack', 1]);
        Assert.isEqual(result.rows[4].values, ['016002', 'Bruce', 1]);
        Assert.isEqual(result.rows[5].values, ['016003', 'Alan', null]);
    }
    result = database.execute("SELECT s.id, s.name, s.gender FROM t_staff s ORDER BY s.gender ASC");
    Assert.isTrue(result instanceof SqlDataTable);
    if (result instanceof SqlDataTable) {
        Assert.isEqual(result.rows.length, 6);
        Assert.isEqual(result.rows[0].values, ['016003', 'Alan', null]);
        Assert.isEqual(result.rows[1].values, ['016001', 'Jack', 1]);
        Assert.isEqual(result.rows[2].values, ['016002', 'Bruce', 1]);
        Assert.isEqual(result.rows[3].values, ['016004', 'Hellen', 2]);
        Assert.isEqual(result.rows[4].values, ['016005', 'Linda', 2]);
        Assert.isEqual(result.rows[5].values, ['016006', 'Royal', 3]);
    }
    result = database.execute("SELECT t.gender, COUNT(*) FROM t_staff t WHERE t.gender IS NOT NULL GROUP BY t.gender ORDER BY COUNT(*)");
    Assert.isTrue(result instanceof SqlDataTable);
    if (result instanceof SqlDataTable) {
        Assert.isEqual(result.rows.length, 3);
        Assert.isEqual(result.rows[0].values, [3, 1]);
        Assert.isEqual(result.rows[1].values, [1, 2]);
        Assert.isEqual(result.rows[2].values, [2, 2]);
    }
    result = database.execute("SELECT t.gender, COUNT(*) FROM t_staff t WHERE t.gender IS NOT NULL GROUP BY t.gender ORDER BY COUNT(*) DESC");
    Assert.isTrue(result instanceof SqlDataTable);
    if (result instanceof SqlDataTable) {
        Assert.isEqual(result.rows.length, 3);
        Assert.isEqual(result.rows[0].values, [1, 2]);
        Assert.isEqual(result.rows[1].values, [2, 2]);
        Assert.isEqual(result.rows[2].values, [3, 1]);
    }
});
Assert.runCase('select limit', function () {
    var database = createDemoDatabase();
    var result = database.execute("SELECT s.id, s.name FROM t_staff s ORDER BY s.id DESC LIMIT 3");
    Assert.isTrue(result instanceof SqlDataTable);
    if (result instanceof SqlDataTable) {
        Assert.isEqual(result.rows.length, 3);
        Assert.isEqual(result.rows[0].values, ['016006', 'Royal']);
        Assert.isEqual(result.rows[1].values, ['016005', 'Linda']);
        Assert.isEqual(result.rows[2].values, ['016004', 'Hellen']);
    }
    result = database.execute("SELECT s.id, s.name FROM t_staff s ORDER BY s.id DESC LIMIT 2, 3");
    Assert.isTrue(result instanceof SqlDataTable);
    if (result instanceof SqlDataTable) {
        Assert.isEqual(result.rows.length, 3);
        Assert.isEqual(result.rows[0].values, ['016004', 'Hellen']);
        Assert.isEqual(result.rows[1].values, ['016003', 'Alan']);
        Assert.isEqual(result.rows[2].values, ['016002', 'Bruce']);
    }
});
