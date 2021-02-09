import Project from '../utils/project';
import { stripIndent } from 'common-tags';

describe('Language Server: Definitions', () => {
  let project!: Project;

  beforeEach(async () => {
    jest.setTimeout(20_000);
    project = await Project.create();
  });

  afterEach(async () => {
    await project.destroy();
  });

  test('component invocation', () => {
    project.write({
      'greeting.ts': stripIndent`
        import Component, { hbs } from '@glimmerx/component';
        export default class Greeting extends Component<{ message: string }> {
          static template = hbs\`{{@message}}, World!\`;
        }
      `,
      'index.ts': stripIndent`
        import Component, { hbs } from '@glimmerx/component';
        import Greeting from './greeting';

        export default class Application extends Component {
          static template = hbs\`
            <Greeting @message="hello" />
          \`;
        }
      `,
    });

    let server = project.startLanguageServer();
    let definitions = server.getDefinition(project.fileURI('index.ts'), {
      line: 5,
      character: 7,
    });

    expect(definitions).toEqual([
      {
        uri: project.fileURI('greeting.ts'),
        range: {
          start: { line: 1, character: 21 },
          end: { line: 1, character: 29 },
        },
      },
    ]);
  });

  test('arg passing', () => {
    project.write({
      'greeting.ts': stripIndent`
        import Component, { hbs } from '@glimmerx/component';

        export interface GreetingArgs {
          message: string;
        }

        export default class Greeting extends Component<GreetingArgs> {
          static template = hbs\`{{@message}}, World!\`;
        }
      `,
      'index.ts': stripIndent`
        import Component, { hbs } from '@glimmerx/component';
        import Greeting from './greeting';

        export default class Application extends Component {
          static template = hbs\`
            <Greeting @message="hello" />
          \`;
        }
      `,
    });

    let server = project.startLanguageServer();
    let definitions = server.getDefinition(project.fileURI('index.ts'), {
      line: 5,
      character: 17,
    });

    expect(definitions).toEqual([
      {
        uri: project.fileURI('greeting.ts'),
        range: {
          start: { line: 3, character: 2 },
          end: { line: 3, character: 9 },
        },
      },
    ]);
  });

  test('arg use', () => {
    project.write({
      'greeting.ts': stripIndent`
        import Component, { hbs } from '@glimmerx/component';

        export interface GreetingArgs {
          message: string;
        }

        export default class Greeting extends Component<GreetingArgs> {
          static template = hbs\`{{@message}}, World!\`;
        }
      `,
    });

    let server = project.startLanguageServer();
    let definitions = server.getDefinition(project.fileURI('greeting.ts'), {
      line: 7,
      character: 30,
    });

    expect(definitions).toEqual([
      {
        uri: project.fileURI('greeting.ts'),
        range: {
          start: { line: 3, character: 2 },
          end: { line: 3, character: 9 },
        },
      },
    ]);
  });

  test('import source', () => {
    project.write({
      'greeting.ts': stripIndent`
        import Component, { hbs } from '@glimmerx/component';

        export interface GreetingArgs {
          message: string;
        }

        export default class Greeting extends Component<GreetingArgs> {
          static template = hbs\`{{@message}}, World!\`;
        }
      `,
      'index.ts': stripIndent`
        import Component, { hbs } from '@glimmerx/component';
        import Greeting from './greeting';

        export class Application extends Component {
          static template = hbs\`
            <Greeting @message="Hello" />
          \`;
        }
      `,
    });

    let server = project.startLanguageServer();
    let definitions = server.getDefinition(project.fileURI('index.ts'), {
      line: 1,
      character: 27,
    });

    expect(definitions).toEqual([
      {
        uri: project.fileURI('greeting.ts'),
        range: {
          start: { line: 0, character: 0 },
          end: { line: 8, character: 1 },
        },
      },
    ]);
  });
});
