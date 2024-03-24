import {computeScore} from "./logic";

test('Normal maine ok, score from ew', () => {
    const state = JSON.parse(
        `
{
  "positions": {
    "Calypso ": "north",
    "Brice": "south",
    "Alessandra ": "west",
    "Delphine ": "east"
  },
  "annonce": {
    "amount": 110,
    "suit": "heart",
    "player": "Alessandra "
  }
}        
        `);
    const {effectiveNsScore, effectiveEwScore} = computeScore({
        ...state,
        ewScore: 110
    });

    expect({effectiveNsScore, effectiveEwScore})
        .toStrictEqual({
            effectiveNsScore: 50,
            effectiveEwScore: 110
        });
    
});

test('One digit score, score from ew', () => {
    const state = JSON.parse(
        `
{
  "positions": {
    "Calypso ": "north",
    "Brice": "south",
    "Alessandra ": "west",
    "Delphine ": "east"
  },
  "annonce": {
    "amount": 110,
    "suit": "heart",
    "player": "Alessandra "
  }
}        
        `);

    expect(
        computeScore({
            ...state,
            ewScore: '1'
        })
    ).toStrictEqual({
        effectiveNsScore: 160,
        effectiveEwScore: 0,
        nsFail:false,
        ewFail:true,
        nsScore: 161,
        ewScore: 1,
        validForm: true
    })
});

test('Normal maine ok, score from ns', () => {
    const state = JSON.parse(
        `
{
  "positions": {
    "Calypso ": "north",
    "Brice": "south",
    "Alessandra ": "west",
    "Delphine ": "east"
  },
  "annonce": {
    "amount": 110,
    "suit": "heart",
    "player": "Alessandra "
  }
}        
        `);
    const {effectiveNsScore, effectiveEwScore} = computeScore({
        ...state,
        nsScore: 52
    });

    expect({effectiveNsScore, effectiveEwScore})
        .toStrictEqual({
            effectiveNsScore: 50,
            effectiveEwScore: 110
        });

});

test('Normal maine ok, score from ns + belote ew', () => {
    const state = JSON.parse(
        `
{
  "positions": {
    "Calypso ": "north",
    "Brice": "south",
    "Alessandra ": "west",
    "Delphine ": "east"
  },
  "annonce": {
    "amount": 110,
    "suit": "heart",
    "player": "Alessandra "
  }
}        
        `);
    const {effectiveNsScore, effectiveEwScore} = computeScore({
        ...state,
        nsScore: 52,
        belote:'ew'
    });

    expect({effectiveNsScore, effectiveEwScore})
        .toStrictEqual({
            effectiveNsScore: 50,
            effectiveEwScore: 130
        });

});

test('Normal maine ok by belote, score from ns + belote ew', () => {
    const state = JSON.parse(
        `
{
  "positions": {
    "Calypso ": "north",
    "Brice": "south",
    "Alessandra ": "west",
    "Delphine ": "east"
  },
  "annonce": {
    "amount": 110,
    "suit": "heart",
    "player": "Alessandra "
  }
}        
        `);
    expect(computeScore({
        ...state,
        nsScore: 72,
        belote:'ew'
    })).toStrictEqual({
            effectiveNsScore: 70,
            effectiveEwScore: 110,
            nsScore: 72,
            ewScore: 90,
            nsFail:false,
            ewFail:false,
            validForm:true
        });

});

test('Normal maine ok by belote, score from ns + belote ew, round up', () => {
    const state = JSON.parse(
        `
{
  "positions": {
    "Calypso ": "north",
    "Brice": "south",
    "Alessandra ": "west",
    "Delphine ": "east"
  },
  "annonce": {
    "amount": 110,
    "suit": "heart",
    "player": "Alessandra "
  }
}        
        `);

    expect(
        computeScore({
            ...state,
            nsScore: 67,
            belote:'ew'
        })
    ).toStrictEqual({
            effectiveNsScore: 70,
            effectiveEwScore: 120,
            nsScore: 67,
            ewScore: 95,
            nsFail:false,
            ewFail:false,
            validForm:true
        });

});

test('Normal maine ok, score from ns, round up', () => {
    const state = JSON.parse(
        `
{
  "positions": {
    "Calypso ": "north",
    "Brice": "south",
    "Alessandra ": "west",
    "Delphine ": "east"
  },
  "annonce": {
    "amount": 110,
    "suit": "heart",
    "player": "Alessandra "
  }
}        
        `);
    const {effectiveNsScore, effectiveEwScore} = computeScore({
        ...state,
        nsScore: 47
    });

    expect({effectiveNsScore, effectiveEwScore})
        .toStrictEqual({
            effectiveNsScore: 50,
            effectiveEwScore: 120
        });

});

test('Normal maine ok, score from ew, round up', () => {
    const state = JSON.parse(
        `
{
  "positions": {
    "Calypso ": "north",
    "Brice": "south",
    "Alessandra ": "west",
    "Delphine ": "east"
  },
  "annonce": {
    "amount": 110,
    "suit": "heart",
    "player": "Alessandra "
  }
}        
        `);
    const {effectiveNsScore, effectiveEwScore} = computeScore({
        ...state,
        ewScore: 115
    });

    expect({effectiveNsScore, effectiveEwScore})
        .toStrictEqual({
            effectiveNsScore: 50,
            effectiveEwScore: 120
        });

});

test('Normal maine fail, score from ew', () => {
    const state = JSON.parse(
        `
{
  "positions": {
    "Calypso ": "north",
    "Brice": "south",
    "Alessandra ": "west",
    "Delphine ": "east"
  },
  "annonce": {
    "amount": 110,
    "suit": "heart",
    "player": "Alessandra "
  }
}        
        `);
    const {effectiveNsScore, effectiveEwScore} = computeScore({
        ...state,
        ewScore: 109
    });

    expect({effectiveNsScore, effectiveEwScore})
        .toStrictEqual({
            effectiveNsScore: 160,
            effectiveEwScore: 0
        });

});

test('Normal maine fail + belote, score from ew', () => {
    const state = JSON.parse(
        `
{
  "positions": {
    "Calypso ": "north",
    "Brice": "south",
    "Alessandra ": "west",
    "Delphine ": "east"
  },
  "annonce": {
    "amount": 110,
    "suit": "heart",
    "player": "Alessandra "
  }
}        
        `);
    expect(computeScore({
        ...state,
        ewScore: 89,
        belote: 'ew'
    })).toStrictEqual({
        effectiveNsScore: 180,
        effectiveEwScore: 0,
        nsScore: 73,
        ewScore: 89,
        nsFail:false,
        ewFail:true,
        validForm:true

    });

});

test('Normal maine fail, score from ns', () => {
    const state = JSON.parse(
        `
{
  "positions": {
    "Calypso ": "north",
    "Brice": "south",
    "Alessandra ": "west",
    "Delphine ": "east"
  },
  "annonce": {
    "amount": 110,
    "suit": "heart",
    "player": "Alessandra "
  }
}        
        `);
    const {effectiveNsScore, effectiveEwScore} = computeScore({
        ...state,
        nsScore: 53
    });

    expect({effectiveNsScore, effectiveEwScore})
        .toStrictEqual({
            effectiveNsScore: 160,
            effectiveEwScore: 0
        });

});


test('Normal maine ok, capot', () => {
    const state = JSON.parse(
        `
{
  "positions": {
    "Calypso ": "north",
    "Brice": "south",
    "Alessandra ": "west",
    "Delphine ": "east"
  },
  "annonce": {
    "amount": 110,
    "suit": "heart",
    "player": "Alessandra "
  }
}        
        `);
    expect(
        computeScore({
            ...state,
            capot:true
        })
    ).toStrictEqual({
        effectiveNsScore: 0,
        effectiveEwScore: 250,
        nsScore: 0,
        ewScore: 162,
        nsFail:false,
        ewFail:false,
        validForm:true
    });

});

test('Normal maine ok, capot + belote', () => {
    const state = JSON.parse(
        `
{
  "positions": {
    "Calypso ": "north",
    "Brice": "south",
    "Alessandra ": "west",
    "Delphine ": "east"
  },
  "annonce": {
    "amount": 110,
    "suit": "heart",
    "player": "Alessandra "
  }
}        
        `);
    expect(computeScore({
        ...state,
        capot:true,
        belote: 'ew'
    })).toStrictEqual({
        effectiveNsScore: 0,
        effectiveEwScore: 270,
        nsScore: 0,
        ewScore: 162,
        nsFail:false,
        ewFail:false,
        validForm:true
    });

});

test('Normal maine ok, capot + belote lost', () => {
    const state = JSON.parse(
        `
{
  "positions": {
    "Calypso ": "north",
    "Brice": "south",
    "Alessandra ": "west",
    "Delphine ": "east"
  },
  "annonce": {
    "amount": 110,
    "suit": "heart",
    "player": "Alessandra "
  }
}        
        `);
    expect(computeScore({
        ...state,
        capot:true,
        belote: 'ns'
    })).toStrictEqual({
        effectiveNsScore: 0,
        effectiveEwScore: 270,
        nsScore: 0,
        ewScore: 162,
        nsFail:false,
        ewFail:false,
        validForm:true
    });
});

test('Normal maine, ns penalty', () => {
    const state = JSON.parse(
        `
{
  "positions": {
    "Calypso ": "north",
    "Brice": "south",
    "Alessandra ": "west",
    "Delphine ": "east"
  },
  "annonce": {
    "amount": 110,
    "suit": "heart",
    "player": "Alessandra "
  }
}        
        `);
    expect(computeScore({
        ...state,
        nsPenalty:true
    })).toStrictEqual({
        effectiveNsScore: 0,
        effectiveEwScore: 160,
       ewFail: false,
       ewScore: 160,
       nsFail: true,
       nsScore: 0,
        validForm:true
    });
});

test('Normal maine, ew penalty', () => {
    const state = JSON.parse(
        `
{
  "positions": {
    "Calypso ": "north",
    "Brice": "south",
    "Alessandra ": "west",
    "Delphine ": "east"
  },
  "annonce": {
    "amount": 110,
    "suit": "heart",
    "player": "Alessandra "
  }
}        
        `);
    expect(computeScore({
        ...state,
        ewPenalty:true
    })).toStrictEqual({
        effectiveNsScore: 160,
        effectiveEwScore: 0,
        ewFail: true,
        ewScore: 0,
        nsFail: false,
        nsScore: 160,
        validForm:true
    });
});

test('Normal maine invalid, score from ew', () => {
    const state = JSON.parse(
        `
{
  "positions": {
    "Calypso ": "north",
    "Brice": "south",
    "Alessandra ": "west",
    "Delphine ": "east"
  },
  "annonce": {
    "amount": 110,
    "suit": "heart",
    "player": "Alessandra "
  }
}        
        `);
    expect(computeScore({
        ...state,
        ewScore: 200,
    })).toStrictEqual({
        effectiveNsScore: -40,
        effectiveEwScore: 200,
        nsScore: -38,
        ewScore: 200,
        nsFail:false,
        ewFail:false,
        validForm:false

    });

});

test('Normal maine invalid, score from ns', () => {
    const state = JSON.parse(
        `
{
  "positions": {
    "Calypso ": "north",
    "Brice": "south",
    "Alessandra ": "west",
    "Delphine ": "east"
  },
  "annonce": {
    "amount": 110,
    "suit": "heart",
    "player": "Alessandra "
  }
}        
        `);
    expect(computeScore({
        ...state,
        nsScore: 200,
    })).toStrictEqual({
        effectiveNsScore: 200,
        effectiveEwScore: -40,
        nsScore: 200,
        ewScore: -38,
        nsFail:false,
        ewFail:false,
        validForm:false
    });
});

test('Advertized capot ok', () => {
    const state = JSON.parse(
        `
{
  "positions": {
    "Calypso ": "north",
    "Brice": "south",
    "Alessandra ": "west",
    "Delphine ": "east"
  },
  "annonce":  {
      "amount": 500,
      "suit": "club",
      "player": "Alessandra "
    }
}        
        `);
    expect(computeScore({
        ...state,
        capot: true,
    })).toStrictEqual({
        effectiveNsScore: 0,
        effectiveEwScore: 500,
        nsScore: 0,
        ewScore: 162,
        nsFail:false,
        ewFail:false,
        validForm:true
    });
});
test('Advertized capot fail, score from ns', () => {
    const state = JSON.parse(
        `
{
  "positions": {
    "Calypso ": "north",
    "Brice": "south",
    "Alessandra ": "west",
    "Delphine ": "east"
  },
  "annonce":  {
      "amount": 500,
      "suit": "club",
      "player": "Alessandra "
    }
}        
        `);
    expect(computeScore({
        ...state,
        nsScore: 12,
    })).toStrictEqual({
        effectiveNsScore: 500,
        effectiveEwScore: 0,
        nsScore: 12,
        ewScore: 150,
        nsFail:false,
        ewFail:true,
        validForm:true
    });
});
test('Advertized capot fail, score from ns with 0 points', () => {
    const state = JSON.parse(
        `
{
  "positions": {
    "Calypso ": "north",
    "Brice": "south",
    "Alessandra ": "west",
    "Delphine ": "east"
  },
  "annonce":  {
      "amount": 500,
      "suit": "club",
      "player": "Alessandra "
    }
}        
        `);
    expect(computeScore({
        ...state,
        nsScore: 0,
    })).toStrictEqual({
        effectiveNsScore: 500,
        effectiveEwScore: 0,
        nsScore: 0,
        ewScore: 162,
        nsFail:false,
        ewFail:true,
        validForm:true
    });
});

test('Advertized capot fail + belote lost, score from ns', () => {
    const state = JSON.parse(
        `
{
  "positions": {
    "Calypso ": "north",
    "Brice": "south",
    "Alessandra ": "west",
    "Delphine ": "east"
  },
  "annonce":  {
      "amount": 500,
      "suit": "club",
      "player": "Alessandra "
    }
}        
        `);
    expect(computeScore({
        ...state,
        nsScore: 12,
        belote:'ew'
    })).toStrictEqual({
        effectiveNsScore: 520,
        effectiveEwScore: 0,
        nsScore: 12,
        ewScore: 150,
        nsFail:false,
        ewFail:true,
        validForm:true
    });
});

test('Advertized capot fail + belote, score from ns', () => {
    const state = JSON.parse(
        `
{
  "positions": {
    "Calypso ": "north",
    "Brice": "south",
    "Alessandra ": "west",
    "Delphine ": "east"
  },
  "annonce":  {
      "amount": 500,
      "suit": "club",
      "player": "Alessandra "
    }
}        
        `);
    expect(computeScore({
        ...state,
        nsScore: 12,
        belote:'ns'
    })).toStrictEqual({
        effectiveNsScore: 520,
        effectiveEwScore: 0,
        nsScore: 12,
        ewScore: 150,
        nsFail:false,
        ewFail:true,
        validForm:true
    });
});

test('Advertized capot ok + belote', () => {
    const state = JSON.parse(
        `
{
  "positions": {
    "Calypso ": "north",
    "Brice": "south",
    "Alessandra ": "west",
    "Delphine ": "east"
  },
  "annonce":  {
      "amount": 500,
      "suit": "club",
      "player": "Alessandra "
    }
}        
        `);
    expect(computeScore({
        ...state,
        capot: true,
        belote: 'ew'
    })).toStrictEqual({
        effectiveNsScore: 0,
        effectiveEwScore: 520,
        nsScore: 0,
        ewScore: 162,
        nsFail:false,
        ewFail:false,
        validForm:true
    });
});

test('Advertized capot ok + belote lost', () => {
    const state = JSON.parse(
        `
{
  "positions": {
    "Calypso ": "north",
    "Brice": "south",
    "Alessandra ": "west",
    "Delphine ": "east"
  },
  "annonce":  {
      "amount": 500,
      "suit": "club",
      "player": "Alessandra "
    }
}        
        `);
    expect(computeScore({
        ...state,
        capot: true,
        belote: 'ns'
    })).toStrictEqual({
        effectiveNsScore: 0,
        effectiveEwScore: 520,
        nsScore: 0,
        ewScore: 162,
        nsFail:false,
        ewFail:false,
        validForm:true
    });
});

test('Advertized capot contre ok', () => {
    const state = JSON.parse(
        `
{
  "positions": {
    "Calypso ": "north",
    "Brice": "south",
    "Alessandra ": "west",
    "Delphine ": "east"
  },
  "annonce":  {
      "amount": 500,
      "suit": "club",
      "player": "Brice",
      "contre": {
        "player": "Alessandra "
      }
    }
}        
        `);
    expect(computeScore({
        ...state,
        capot: true,
    })).toStrictEqual({
        effectiveNsScore: 1000,
        effectiveEwScore: 0,
        nsFail:false,
        ewFail:false,
        nsScore: 162,
        ewScore: 0,
        validForm:true
    });
});

test('Advertized capot contre fail, score from ns', () => {
    const state = JSON.parse(
        `
{
  "positions": {
    "Calypso ": "north",
    "Brice": "south",
    "Alessandra ": "west",
    "Delphine ": "east"
  },
  "annonce":  {
      "amount": 500,
      "suit": "club",
      "player": "Brice",
      "contre": {
        "player": "Alessandra "
      }
    }
}        
        `);
    expect(computeScore({
        ...state,
        nsScore: 152,
    })).toStrictEqual({
        effectiveNsScore: 0,
        effectiveEwScore: 1000,
        nsScore: 152,
        ewScore: 10,
        nsFail: true,
        ewFail: false,
        validForm:true
    });
});

test('Advertized capot contre fail+belote, score from ns', () => {
    const state = JSON.parse(
        `
{
  "positions": {
    "Calypso ": "north",
    "Brice": "south",
    "Alessandra ": "west",
    "Delphine ": "east"
  },
  "annonce":  {
      "amount": 500,
      "suit": "club",
      "player": "Brice",
      "contre": {
        "player": "Alessandra "
      }
    }
}        
        `);
    expect(computeScore({
        ...state,
        nsScore: 152,
        belote: 'ns'
    })).toStrictEqual({
        effectiveNsScore: 0,
        effectiveEwScore: 1020,
        nsScore: 152,
        ewScore: 10,
        nsFail: true,
        ewFail: false,
        validForm:true
    });
});

test('Advertized capot contre ok + belote', () => {
    const state = JSON.parse(
        `
{
  "positions": {
    "Calypso ": "north",
    "Brice": "south",
    "Alessandra ": "west",
    "Delphine ": "east"
  },
  "annonce":  {
      "amount": 500,
      "suit": "club",
      "player": "Brice",
      "contre": {
        "player": "Alessandra "
      }
    }
}        
        `);
    expect(computeScore({
        ...state,
        capot: true,
        belote: 'ns'
    })).toStrictEqual({
        effectiveNsScore: 1020,
        effectiveEwScore: 0,
        nsFail:false,
        ewFail:false,
        nsScore: 162,
        ewScore: 0,
        validForm:true
    });
});

test('Advertized capot contre ok + belote lost', () => {
    const state = JSON.parse(
        `
{
  "positions": {
    "Calypso ": "north",
    "Brice": "south",
    "Alessandra ": "west",
    "Delphine ": "east"
  },
  "annonce":  {
      "amount": 500,
      "suit": "club",
      "player": "Brice",
      "contre": {
        "player": "Alessandra "
      }
    }
}        
        `);
    expect(computeScore({
        ...state,
        capot: true,
        belote: 'ew'
    })).toStrictEqual({
        effectiveNsScore: 1020,
        effectiveEwScore: 0,
        nsFail:false,
        ewFail:false,
        nsScore: 162,
        ewScore: 0,
        validForm:true
    });
});

test('Advertized capot contre surcontre ok', () => {
    const state = JSON.parse(
        `
{
  "positions": {
    "Calypso ": "north",
    "Brice": "south",
    "Alessandra ": "west",
    "Delphine ": "east"
  },
  "annonce":  {
      "amount": 500,
      "suit": "club",
      "player": "Delphine ",
      "contre": {
        "player": "Calypso "
      },
      "surContre": {
        "player": "Alessandra "
      }
    }
}        
        `);
    expect(computeScore({
        ...state,
        capot: true,
    })).toStrictEqual({
        effectiveNsScore: 0,
        effectiveEwScore: 2000,
        nsFail:false,
        ewFail:false,
        nsScore: 0,
        ewScore: 162,
        validForm:true
    });
});


test('Contre ok, score from ns', () => {
    const state = JSON.parse(
        `
{
  "positions": {
    "Calypso ": "north",
    "Brice": "south",
    "Alessandra ": "west",
    "Delphine ": "east"
  },
  "annonce":  {
      "amount": 100,
      "suit": "club",
      "player": "Calypso ",
      "contre": {
        "player": "Alessandra "
      }
    }
}        
        `);
    expect(computeScore({
        ...state,
        nsScore: 101,
    })).toStrictEqual({
        effectiveNsScore: 320,
        effectiveEwScore: 0,
        nsFail:false,
        ewFail:true,
        nsScore: 101,
        ewScore: 61,
        validForm:true
    });
});

test('Contre ok, capot', () => {
    const state = JSON.parse(
        `
{
  "positions": {
    "Calypso ": "north",
    "Brice": "south",
    "Alessandra ": "west",
    "Delphine ": "east"
  },
  "annonce":  {
      "amount": 100,
      "suit": "club",
      "player": "Calypso ",
      "contre": {
        "player": "Alessandra "
      }
    }
}        
        `);
    expect(computeScore({
        ...state,
        capot: true,
    })).toStrictEqual({
        effectiveNsScore: 320,
        effectiveEwScore: 0,
        nsFail:false,
        ewFail:true,
        nsScore: 162,
        ewScore: 0,
        validForm:true
    });
});

test('Contre ok + belote, score from ns', () => {
    const state = JSON.parse(
        `
{
  "positions": {
    "Calypso ": "north",
    "Brice": "south",
    "Alessandra ": "west",
    "Delphine ": "east"
  },
  "annonce":  {
      "amount": 100,
      "suit": "club",
      "player": "Calypso ",
      "contre": {
        "player": "Alessandra "
      }
    }
}        
        `);
    expect(computeScore({
        ...state,
        nsScore: 101,
        belote: 'ns'
    })).toStrictEqual({
        effectiveNsScore: 340,
        effectiveEwScore: 0,
        nsFail:false,
        ewFail:true,
        nsScore: 101,
        ewScore: 61,
        validForm:true
    });
});

test('Contre ok + belote lost, score from ew', () => {
    const state = JSON.parse(
        `
{
  "positions": {
    "Calypso ": "north",
    "Brice": "south",
    "Alessandra ": "west",
    "Delphine ": "east"
  },
  "annonce":  {
      "amount": 100,
      "suit": "club",
      "player": "Calypso ",
      "contre": {
        "player": "Alessandra "
      }
    }
}        
        `);
    expect(computeScore({
        ...state,
        ewScore: 61,
        belote: 'ew'
    })).toStrictEqual({
        effectiveNsScore: 340,
        effectiveEwScore: 0,
        nsFail:false,
        ewFail:true,
        nsScore: 101,
        ewScore: 61,
        validForm:true
    });
});

test('Surcontre ok, score from ns', () => {
    const state = JSON.parse(
        `
{
  "positions": {
    "Calypso ": "north",
    "Brice": "south",
    "Alessandra ": "west",
    "Delphine ": "east"
  },
  "annonce":  {
      "amount": 100,
      "suit": "club",
      "player": "Calypso ",
      "contre": {
        "player": "Alessandra "
      },
      "surContre": {
        "player": "Calypso"
       }
    }
}        
        `);
    expect(computeScore({
        ...state,
        nsScore: 101,
    })).toStrictEqual({
        effectiveNsScore: 640,
        effectiveEwScore: 0,
        nsFail:false,
        ewFail:true,
        nsScore: 101,
        ewScore: 61,
        validForm:true
    });
});

test('Surcontre fail, score from ns', () => {
    const state = JSON.parse(
        `
{
  "positions": {
    "Calypso ": "north",
    "Brice": "south",
    "Alessandra ": "west",
    "Delphine ": "east"
  },
  "annonce":  {
      "amount": 100,
      "suit": "club",
      "player": "Calypso ",
      "contre": {
        "player": "Alessandra "
      },
      "surContre": {
        "player": "Calypso"
       }
    }
}        
        `);
    expect(computeScore({
        ...state,
        nsScore: 99,
    })).toStrictEqual({
        effectiveNsScore: 0,
        effectiveEwScore: 640,
        nsFail:true,
        ewFail:false,
        nsScore: 99,
        ewScore: 63,
        validForm:true
    });
});

