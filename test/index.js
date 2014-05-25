var expect = require('chai').expect;
var compile = require('..').compile;

describe('ES6ModulesCommonJS', function() {
  function transform(code) {
    return compile(code).code;
  }

  function expectTransform(code, result) {
    expect(transform(code)).to.eql(result);
  }

  it('should fix module declaration', function() {
    expectTransform('module a from "b";', 'var a = require("b");');
  });

  it('should fix export declaration', function() {
    expectTransform('export {a, b as c} from "d";', 'module.exports["a"] = require("d")["a"], module.exports["c"] = require("d")["b"];');
    expectTransform('export * from "a";', [
      '(function() {',
      '  var exportedModule = require("a");',
      '',
      '  for (var key in exportedModule) {',
      '    module.exports[key] = exportedModule[key];',
      '  }',
      '})();'
    ].join('\n'));
    expectTransform('export {a, b as c};', 'module.exports["a"] = a, module.exports["c"] = b;');
    expectTransform('export default function a() {};', 'module.exports = function a() {};');
    expectTransform('export var a = 1;', 'var a = module.exports["a"] = 1;');
    expectTransform('export let a = 1;', 'let a = module.exports["a"] = 1;');
    expectTransform('export const a = 1;', 'const a = module.exports["a"] = 1;');
    expectTransform('export function a(b, c=1, ...d) {};', 'module.exports["a"] = function a(b, c=1, ...d) {};');
    expectTransform('export class A {};', 'module.exports["A"] = class A {};');
  });

  it('should fix import declaration', function() {
    expectTransform('import a from "b";', 'var a = require("b")["a"];');
    expectTransform('import {a, b as c} from "d";', 'var a = require("d")["a"], c = require("d")["b"];');
    expectTransform('import "a";', 'require("a");');
  });
});
