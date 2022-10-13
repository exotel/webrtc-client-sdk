import { alpha, makeStyles } from '@material-ui/core/styles';

const styles = makeStyles((theme) => ({
    appbar: {
        background: 'transparent'
    },
    grow: {
      flex:1
      },
      menuButton: {
        marginRight: theme.spacing(2),
      },
      options: {
        fontSize: 15,
        margin: theme.spacing(1),
        color: '#2194FF',
    },
      phoneLogin:{
        width: theme.spacing(35),
        height: theme.spacing(45),
        backgroundColor: '#424242'
      },
      popupMenu:{
        width: theme.spacing(24),
        height: theme.spacing(20),
        backgroundColor: 'white',
        marginRight: theme.spacing(4),
        marginTop: theme.spacing(1)
      },
      title: {
        display: 'none',
        [theme.breakpoints.up('sm')]: {
          display: 'block',
        },
        margin: 10,
      },
      textfield: {
          width: theme.spacing(25),
          height: theme.spacing(5),
          margin: theme.spacing(3),
          borderRadius:4,
          border: 'none',
          "&.Mui-focused": {
            border: "2px solid red",
            '& .MuiOutlinedInput-notchedOutline': {
              border: 'none'
            }
          }
      },
      phoneLoginTypography: {
          color:'#FFFFFF',
          fontSize: 17,
          fontWeight: 'bold',
          marginTop: theme.spacing(2),
      },
      submitBtn: {
        backgroundColor: '#2194FF',
        color: 'white',
        textTransform: 'none',
        fontSize: 17,
        border: 'none',
        width: theme.spacing(13),
        height: theme.spacing(5),
        borderRadius: 5
      },
      sectionDesktop: {
        display: 'none',
        [theme.breakpoints.up('md')]: {
          display: 'flex',
        },
      },
      sectionMobile: {
        display: 'flex',
        [theme.breakpoints.up('md')]: {
          display: 'none',
        },
      },
      button: {
          textTransform:'none',
          fontWeight: 'medium',
          fontSize: 15,
          color: '#2194FF'
      },
      menuPaper: {
        backgroundColor:'#FFFFFF',
        marginTop: 5
      },
      navBarCard: {
        width: theme.spacing(25),
        height: theme.spacing(8),
        backgroundColor:'#FFFFFF'
      },
      menu: {
          marginTop:30
      },
      drawer: {
        marginTop: theme.spacing(10),
        width: '25% !important',
        height: '50% !important',
        marginBottom: theme.spacing(30)
      },
      dialpad: {
        width: theme.spacing(50),
        height: theme.spacing(20),
        marginBottom: theme.spacing(3),
        backgroundColor: 'white'
    },
    notification: {
      width: theme.spacing(40),
      height: theme.spacing(15),
      marginBottom: theme.spacing(3),
      backgroundColor: 'white'
  }
}))

export { styles };