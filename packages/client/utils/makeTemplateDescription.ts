import graphql from 'babel-plugin-relay/macro'
import {readInlineData} from 'relay-runtime'
import {makeTemplateDescription_template} from '../__generated__/makeTemplateDescription_template.graphql'
import relativeDate from './date/relativeDate'

const makeTemplateDescription = (templateRef: any) => {
  const template = readInlineData<makeTemplateDescription_template>(
    graphql`
      fragment makeTemplateDescription_template on ReflectTemplate @inline {
        lastUsedAt
        scope
        team {
          name
        }
      }
    `,
    templateRef
  )
  const {lastUsedAt, scope, team} = template
  const {name: teamName} = team
  if (scope === 'TEAM') return lastUsedAt ? `Last used ${relativeDate(lastUsedAt)}` : 'Never used'
  return `Created by ${teamName}`
}

export default makeTemplateDescription
