var update = require('./');
var expect = require('expect');

describe('update', function() {

  describe('$push', function() {
    it('pushes', function() {
      expect(update([1], {$push: [7]})).toEqual([1, 7]);
    });
    it('does not mutate the original object', function() {
      var obj = [1];
      update(obj, {$push: [7]});
      expect(obj).toEqual([1]);
    });
    it('only pushes an array', function() {
      expect(update.bind(null, [], {$push: 7})).toThrow(
        'update(): expected spec of $push to be an array; got 7. Did you ' +
        'forget to wrap your parameter in an array?'
      );
    });
    it('only pushes unto an array', function() {
      expect(update.bind(null, 1, {$push: 7})).toThrow(
        'update(): expected target of $push to be an array; got 1.'
      );
    });
  });

  describe('$unshift', function() {
    it('unshifts', function() {
      expect(update([1], {$unshift: [7]})).toEqual([7, 1]);
    });
    it('does not mutate the original object', function() {
      var obj = [1];
      update(obj, {$unshift: [7]});
      expect(obj).toEqual([1]);
    });
    it('only unshifts an array', function() {
      expect(update.bind(null, [], {$unshift: 7})).toThrow(
        'update(): expected spec of $unshift to be an array; got 7. Did you ' +
        'forget to wrap your parameter in an array?'
      );
    });
    it('only unshifts unto an array', function() {
      expect(update.bind(null, 1, {$unshift: 7})).toThrow(
        'update(): expected target of $unshift to be an array; got 1.'
      );
    });
  });

  describe('$splice', function() {
    it('splices', function() {
      expect(update([1, 4, 3], {$splice: [[1, 1, 2]]})).toEqual([1, 2, 3]);
    });
    it('does not mutate the original object', function() {
      var obj = [1, 4, 3];
      update(obj, {$splice: [[1, 1, 2]]});
      expect(obj).toEqual([1, 4, 3]);
    });
    it('only splices an array of arrays', function() {
      expect(update.bind(null, [], {$splice: 1})).toThrow(
        'update(): expected spec of $splice to be an array of arrays; got 1. ' +
        'Did you forget to wrap your parameters in an array?'
      );
      expect(update.bind(null, [], {$splice: [1]})).toThrow(
        'update(): expected spec of $splice to be an array of arrays; got 1. ' +
        'Did you forget to wrap your parameters in an array?'
      );
    });
    it('only splices unto an array', function() {
      expect(update.bind(null, 1, {$splice: 7})).toThrow(
        'Expected $splice target to be an array; got 1'
      );
    });
  });

  describe('$merge', function() {
    it('merges', function() {
      expect(update({a: 'b'}, {$merge: {c: 'd'}})).toEqual({a: 'b', c: 'd'});
    });
    it('does not mutate the original object', function() {
      var obj = {a: 'b'};
      update(obj, {$merge: {c: 'd'}});
      expect(obj).toEqual({a: 'b'});
    });
    it('only merges with an object', function() {
      expect(update.bind(null, {}, {$merge: 7})).toThrow(
        'update(): $merge expects a spec of type \'object\'; got 7'
      );
    });
    it('only merges with an object', function() {
      expect(update.bind(null, 7, {$merge: {a: 'b'}})).toThrow(
        'update(): $merge expects a target of type \'object\'; got 7'
      );
    });
  });

  describe('$set', function() {
    it('sets', function() {
      expect(update({a: 'b'}, {$set: {c: 'd'}})).toEqual({c: 'd'});
    });
    it('does not mutate the original object', function() {
      var obj = {a: 'b'};
      update(obj, {$set: {c: 'd'}});
      expect(obj).toEqual({a: 'b'});
    });
    it('keeps reference equality when possible', function() {
      var original = {a: 1};
      expect(update(original, {a: {$set: 1}})).toBe(original);
      expect(update(original, {a: {$set: 2}})).toNotBe(original);
    });
  });

  describe('$unset', function() {
    it('unsets', function() {
      expect(update({a: 'b'}, {$unset: ['a']}).a).toBe(undefined);
    });
    it('removes the key from the object', function() {
      var removed = update({a: 'b'}, {$unset: ['a']});
      expect('a' in removed).toBe(false);
    });
    it('removes multiple keys from the object', function() {
      var original = {a: 'b', c: 'd', e: 'f'};
      var removed = update(original, {$unset: ['a', 'e']});
      expect('a' in removed).toBe(false);
      expect('a' in original).toBe(true);
      expect('e' in removed).toBe(false);
      expect('e' in original).toBe(true);
    });
    it('does not remove keys from the inherited properties', function() {
      function Parent() { this.foo = 'Parent'; }
      function Child() {}
      Child.prototype = new Parent()
      var child = new Child();
      expect(update(child, {$unset: ['foo']}).foo).toEqual('Parent');
    });
    it('keeps reference equality when possible', function() {
      var original = {a: 1};
      expect(update(original, {$unset: ['b']})).toBe(original);
      expect(update(original, {$unset: ['a']})).toNotBe(original);
    });
  });

  describe('$apply', function() {
    var applier = function(node) {
      return {v: node.v * 2};
    };
    it('applies', function() {
      expect(update({v: 2}, {$apply: applier})).toEqual({v: 4});
    });
    it('does not mutate the original object', function() {
      var obj = {v: 2};
      update(obj, {$apply: applier});
      expect(obj).toEqual({v: 2});
    });
    it('only applies a function', function() {
      expect(update.bind(null, 2, {$apply: 123})).toThrow(
        'update(): expected spec of $apply to be a function; got 123.'
      );
    });
    it('keeps reference equality when possible', function() {
      var original = {a: {b: {}}};
      function identity(val) {
        return val;
      }
      expect(update(original, {a: {$apply: identity}})).toBe(original);
      expect(update(original, {a: {$apply: applier}})).toNotBe(original);
    });
  });

  describe('deep update', function() {
    it('works', function() {
      expect(update({
        a: 'b',
        c: {
          d: 'e',
          f: [1],
          g: [2],
          h: [3],
          i: {j: 'k'},
          l: 4,
        },
      }, {
        c: {
          d: {$set: 'm'},
          f: {$push: [5]},
          g: {$unshift: [6]},
          h: {$splice: [[0, 1, 7]]},
          i: {$merge: {n: 'o'}},
          l: {$apply: function(x) { return x * 2 }},
        },
      })).toEqual({
        a: 'b',
        c: {
          d: 'm',
          f: [1, 5],
          g: [6, 2],
          h: [7],
          i: {j: 'k', n: 'o'},
          l: 8,
        },
      });
    });
    it('keeps reference equality when possible', function() {
      var original = {a: {b: 1}, c: {d: {e: 1}}};

      expect(update(original, {a: {b: {$set: 1}}})).toBe(original);
      expect(update(original, {a: {b: {$set: 1}}}).a).toBe(original.a);

      expect(update(original, {c: {d: {e: {$set: 1}}}})).toBe(original);
      expect(update(original, {c: {d: {e: {$set: 1}}}}).c).toBe(original.c);
      expect(update(original, {c: {d: {e: {$set: 1}}}}).c.d).toBe(original.c.d);

      expect(update(original, {
        a: {b: {$set: 1}},
        c: {d: {e: {$set: 1}}},
      })).toBe(original);
      expect(update(original, {
        a: {b: {$set: 1}},
        c: {d: {e: {$set: 1}}},
      }).a).toBe(original.a);
      expect(update(original, {
        a: {b: {$set: 1}},
        c: {d: {e: {$set: 1}}},
      }).c).toBe(original.c);
      expect(update(original, {
        a: {b: {$set: 1}},
        c: {d: {e: {$set: 1}}},
      }).c.d).toBe(original.c.d);

      expect(update(original, {a: {b: {$set: 2}}})).toNotBe(original);
      expect(update(original, {a: {b: {$set: 2}}}).a).toNotBe(original.a);
      expect(update(original, {a: {b: {$set: 2}}}).a.b).toNotBe(original.a.b);

      expect(update(original, {a: {b: {$set: 2}}}).c).toBe(original.c);
      expect(update(original, {a: {b: {$set: 2}}}).c.d).toBe(original.c.d);
    });
  });

  it('should accept array spec to modify arrays', function() {
    var original = {value: [{a: 0}]};
    var modified = update(original, {value: [{a: {$set: 1}}]});
    expect(modified).toEqual({value: [{a: 1}]});
  });

  it('should accept object spec to modify arrays', function() {
    var original = {value: [{a: 0}]};
    var modified = update(original, {value: {'0': {a: {$set: 1}}}});
    expect(modified).toEqual({value: [{a: 1}]});
  });

  it('should reject arrays except as values of specific commands', function() {
    var specs = [
      [],
      {a: []},
      {a: {$set: []}, b: [[]]},
    ];
    specs.forEach(function(spec) {
      expect(update.bind(null, {a: 'b'}, spec)).toThrow(
        'update(): You provided an invalid spec to update(). The spec ' +
        'may not contain an array except as the value of $set, $push, ' +
        '$unshift, $splice or any custom command allowing an array value.'
      );
    });
  });

  it('should reject non arrays from $unset', function() {
    expect(update.bind(null, {a: 'b'}, {$unset: 'a'})).toThrow(
      'update(): expected spec of $unset to be an array; got a. ' +
      'Did you forget to wrap the key(s) in an array?'
    );
  });

  it('should require a plain object spec containing command(s)', function() {
    var specs = [
      null,
      false,
      {a: 'c'},
      {a: {b: 'c'}},
    ];
    specs.forEach(function(spec) {
      expect(update.bind(null, {a: 'b'}, spec)).toThrow(
        'update(): You provided an invalid spec to update(). The spec ' +
        'and every included key path must be plain objects containing one ' +
        'of the following commands: $push, $unshift, $splice, $set, $unset, ' +
        '$merge, $apply.'
      );
    });
  });

  it('should perform safe hasOwnProperty check', function() {
    expect(update({}, {'hasOwnProperty': {$set: 'a'}})).toEqual({
      'hasOwnProperty': 'a',
    });
  });

});


describe('update', function() {
  describe('can extend functionality', function() {
    var myUpdate;
    beforeEach(function() {
      myUpdate = update.newContext();
    });

    it('allows adding new directives', function() {
      myUpdate.extend('$addtax', function(tax, original) {
        return original + (tax * original);
      });
      expect(myUpdate(5, {$addtax: 0.10})).toEqual(5.5);
    });

    it('gets the original object (so be careful about mutations)', function() {
      var obj = {};
      var passedOriginal;
      myUpdate.extend('$foobar', function(prop, original) {
        passedOriginal = original;
      });
      myUpdate(obj, {$foobar: null});
      expect(obj).toBe(passedOriginal);
    });

    it("doesn't touch the original update", function() {
      myUpdate.extend('$addtax', function(tax, original) {
        return original + (tax * original);
      });
      expect(  update.bind(null, {$addtax: 0.10}, {$addtax: 0.10})).toThrow();
      expect(myUpdate.bind(null, {$addtax: 0.10}, {$addtax: 0.10})).toNotThrow();
    });

    it('can handle nibling directives', function() {
      var obj = {a: [1, 2, 3], b: "me"};
      var spec = {
        a: {$splice: [[0, 2]]},
        $merge: {b: "you"},
      };
      expect(update(obj, spec)).toEqual({"a":[3],"b":"you"});
    });

  });

  if (typeof Symbol === 'function' && Symbol('TEST').toString() === 'Symbol(TEST)') {
    describe('works with symbols', function() {
      it('in the source object', function() {
        var obj = {a: 1};
        obj[Symbol.for('b')] = 2;
        expect(update(obj, {c: {$set: 3}})[Symbol.for('b')]).toEqual(2);
      });
      it('in the spec object', function() {
        var obj = {a: 1};
        obj[Symbol.for('b')] = 2;
        var spec = {};
        spec[Symbol.for('b')] = {$set: 2};
        expect(update(obj, spec)[Symbol.for('b')]).toEqual(2);
      });
      it('in the $merge command', function() {
        var obj = {a: 1};
        obj[Symbol.for('b')] = {c: 3};
        obj[Symbol.for('d')] = 4;
        var spec = {};
        spec[Symbol.for('b')] = { $merge: {} };
        spec[Symbol.for('b')].$merge[Symbol.for('e')] = 5;
        var updated = update(obj, spec);
        expect(updated[Symbol.for('b')][Symbol.for('e')]).toEqual(5);
        expect(updated[Symbol.for('d')]).toEqual(4);
      });
    });
  }

});
