var esprima = require('esprima');
var recast = require('recast');
var through = require('through');
var b = recast.types.builders;
var n = recast.types.namedTypes;

var ES6ModulesCommonJS = recast.Visitor.extend({
  visitModuleDeclaration: function(expr) {
    return b.variableDeclaration(
      'var',
      [b.variableDeclarator(
        expr.id,
        b.callExpression(
          b.identifier('require'),
          [expr.source]
        )
      )]
    );
  },

  visitExportDeclaration: function(expr) {
    if (expr.default) {
      return b.expressionStatement(
        b.assignmentExpression(
          '=',
          b.memberExpression(
            b.identifier('module'),
            b.identifier('exports'),
            false
          ),
          expr.declaration
        )
      );
    } else if (n.VariableDeclaration.check(expr.declaration) && expr.declaration.declarations.length == 1) {
      var declaration = expr.declaration;
      var declarator = declaration.declarations[0];

      declarator.init = b.assignmentExpression(
        '=',
        b.memberExpression(
          b.memberExpression(
            b.identifier('module'),
            b.identifier('exports'),
            false
          ),
          b.literal(declarator.id.name),
          true
        ),
        declarator.init
      );

      return declaration;
    } else if (n.FunctionDeclaration.check(expr.declaration)) {
      var functionExpression = b.functionExpression(
        expr.declaration.id,
        expr.declaration.params,
        expr.declaration.body,
        expr.declaration.generator,
        expr.declaration.expression,
        expr.declaration.async || false
      );

      functionExpression.defaults = expr.declaration.defaults;
      functionExpression.rest = expr.declaration.rest;

      return b.expressionStatement(
        b.assignmentExpression(
          '=',
          b.memberExpression(
            b.memberExpression(
              b.identifier('module'),
              b.identifier('exports'),
              false
            ),
            b.literal(expr.declaration.id.name),
            true
          ),
          functionExpression
        )
      );
    } else if (n.ClassDeclaration.check(expr.declaration)) {
      var classExpression = b.classExpression(
        expr.declaration.id,
        expr.declaration.body,
        expr.declaration.superClass
      );

      return b.expressionStatement(
        b.assignmentExpression(
          '=',
          b.memberExpression(
            b.memberExpression(
              b.identifier('module'),
              b.identifier('exports'),
              false
            ),
            b.literal(expr.declaration.id.name),
            true
          ),
          classExpression
        )
      );
    } else if (expr.specifiers.length == 1 && n.ExportBatchSpecifier.check(expr.specifiers[0])) {
      return b.expressionStatement(
        b.callExpression(
          b.functionExpression(
            null,
            [],
            b.blockStatement([
              b.variableDeclaration(
                'var',
                [b.variableDeclarator(
                  b.identifier('exportedModule'),
                  b.callExpression(
                    b.identifier('require'),
                    [b.literal('a')]
                  )
                )]
              ),
              b.forInStatement(
                b.variableDeclaration(
                  'var',
                  [b.variableDeclarator(
                    b.identifier('key'),
                    null
                  )]
                ),
                b.identifier('exportedModule'),
                b.blockStatement([
                  b.expressionStatement(
                    b.assignmentExpression(
                      '=',
                      b.memberExpression(
                        b.memberExpression(
                          b.identifier('module'),
                          b.identifier('exports'),
                          false
                        ),
                        b.identifier('key'),
                        true
                      ),
                      b.memberExpression(
                        b.identifier('exportedModule'),
                        b.identifier('key'),
                        true
                      )
                    )
                  )
                ]),
                false
              )
            ]),
            false,
            false
          ),
          []
        )
      );
    } else {
      return b.expressionStatement(
        b.sequenceExpression(expr.specifiers.map(function(specifier) {
          var source;

          if (expr.source) {
            source = b.memberExpression(
              b.callExpression(
                b.identifier('require'),
                [expr.source]
              ),
              b.literal(specifier.id.name),
              true
            );
          } else {
            source = specifier.id;
          }

          return b.assignmentExpression(
            '=',
            b.memberExpression(
              b.memberExpression(
                b.identifier('module'),
                b.identifier('exports'),
                false
              ),
              b.literal(specifier.name ? specifier.name.name : specifier.id.name),
              true
            ),
            source
          );
        }))
      );
    }
  },

  visitImportDeclaration: function(expr) {
    if (expr.specifiers.length === 0) {
      return b.expressionStatement(
        b.callExpression(
          b.identifier('require'),
          [expr.source]
        )
      );
    } else {
      return b.variableDeclaration(
        'var',
        expr.specifiers.map(function(specifier) {
          return b.variableDeclarator(
            specifier.name || specifier.id,
            b.memberExpression(
              b.callExpression(
                b.identifier('require'),
                [expr.source]
              ),
              b.literal(specifier.id.name),
              true
            )
          );
        })
      );
    }
  }
});

function transform(ast) {
  (new ES6ModulesCommonJS()).visit(ast);
  return ast;
}

function compile(code, options) {
  options = options || {};

  var recastOptions = {
    esprima: esprima,
    sourceFileName: options.sourceFileName,
    sourceMapName: options.sourceMapName
  };

  var ast = recast.parse(code, recastOptions);
  return recast.print(transform(ast), recastOptions);
}

module.exports = function () {
  var data = '';

  function write(buf) {
    data += buf;
  }

  function end() {
    this.queue(compile(data).code);
    this.queue(null);
  }

  return through(write, end);
};

module.exports.transform = transform;
module.exports.compile = compile;
