import { makeStyles } from "@material-ui/core";

const styles = makeStyles((theme) => ({
    root: {
        flexGrow: 1,
        width: '100%',
        backgroundColor: theme.palette.background.paper,
      },
      appbar: {
        backgroundColor: '#2194FF',
        color:'white'
      },
      tabPanel: {
          width: theme.spacing(70),
          height: theme.spacing(50),
          overflowX: 'hidden'
      },
      tab: {
          textTransform: 'none',
          color: 'white',
          fontSize: 15,
          fontWeight: 'bold',

      },
      indicator: {
          background: 'blue',
          color: 'white'
      },
      textField: {
        margin: theme.spacing(2),
        width: theme.spacing(30),
        "&.Mui-focused": {
            color: "#23A5EB"
          }
    },
    input: {
        height: theme.spacing(6),
        borderColor: '#2194FF !important'
    },
    header: {
        color: '#2194FF',
        fontSize: 17,
        fontWeight: 'bold',
        margin: theme.spacing(3)
    },
    floatingLabelFocusStyle: {
        color: "#2194FF"
    },
    button: {
        width: 90,
        height: 40,
        backgroundColor: '#2194FF',
        color: 'white',
        border:'none',
        fontWeight: 'bold',
        margin: 10,
        textTransform: 'none'
    }
}))

export { styles };